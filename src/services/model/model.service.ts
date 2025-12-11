/** @format */

import { ModelApiClient } from "./model.client";
import { LocalStorageService } from "../storage/index";
import fs from "fs/promises";
import path from "path";

export interface ModelPredictionResult {
  reportId: string;
  prediction: any;
  confidence?: number;
  isValidPothole: boolean;
  processedAt: Date;
  originalFilename: string;
}

export class ModelService {
  private modelClient: ModelApiClient;
  private storageService: LocalStorageService;
  private resultsDir: string;

  constructor() {
    this.modelClient = new ModelApiClient();
    // Create storage service for model results
    this.storageService = new LocalStorageService(
      "model-results",
      "/model-results"
    );
    this.resultsDir = path.join(process.cwd(), "uploads", "model-results");
    this.ensureResultsDirectory();
  }

  private async ensureResultsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.resultsDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create model results directory:", error);
    }
  }

  /**
   * Analyze image for pothole detection
   */
  async analyzeImage(
    imageBuffer: Buffer,
    filename: string,
    mimeType: string,
    reportId: string,
    confThreshold: number = 0.25
  ): Promise<ModelPredictionResult> {
    try {
      // Get prediction from model API
      const prediction = await this.modelClient.predict(
        imageBuffer,
        filename,
        mimeType,
        confThreshold
      );

      // Determine if it's a valid pothole based on prediction
      // This logic can be adjusted based on actual model response structure
      const isValidPothole = this.evaluatePrediction(prediction);

      const result: ModelPredictionResult = {
        reportId,
        prediction,
        confidence: prediction.confidence,
        isValidPothole,
        processedAt: new Date(),
        originalFilename: filename,
      };

      // Save result to local storage for debugging
      await this.saveResult(reportId, result);

      return result;
    } catch (error) {
      console.error(`Failed to analyze image for report ${reportId}:`, error);

      // Return a fallback result
      const fallbackResult: ModelPredictionResult = {
        reportId,
        prediction: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        confidence: 0,
        isValidPothole: false, // Default to false on error
        processedAt: new Date(),
        originalFilename: filename,
      };

      await this.saveResult(reportId, fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * Evaluate prediction to determine if it's a valid pothole
   * Based on actual model response structure
   */
  private evaluatePrediction(prediction: any): boolean {
    // Check if the prediction was successful
    if (!prediction.success) {
      return false;
    }

    // Check if any potholes were detected
    if (prediction.count && prediction.count > 0) {
      return true;
    }

    // Check if we have detections array with potholes
    if (prediction.detections && Array.isArray(prediction.detections)) {
      const potholeDetections = prediction.detections.filter(
        (detection: any) =>
          detection.class === "pothole" && detection.confidence > 0.5
      );
      return potholeDetections.length > 0;
    }

    return false;
  }
  /**
   * Save prediction result to local storage for debugging
   */
  private async saveResult(
    reportId: string,
    result: ModelPredictionResult
  ): Promise<void> {
    try {
      const timestamp = Date.now();
      const filename = `${reportId}-${timestamp}.json`;
      const filePath = path.join(this.resultsDir, filename);

      await fs.writeFile(filePath, JSON.stringify(result, null, 2), "utf-8");
      console.log(`Model prediction result saved: ${filename}`);

      // Save annotated image if present
      if (result.prediction?.annotated_image) {
        await this.saveAnnotatedImage(
          reportId,
          result.prediction.annotated_image,
          timestamp
        );
      }
    } catch (error) {
      console.error("Failed to save model result:", error);
    }
  }

  /**
   * Save the annotated image from model response
   */
  private async saveAnnotatedImage(
    reportId: string,
    base64Image: string,
    timestamp: number
  ): Promise<void> {
    try {
      // Parse the base64 image data
      const matches = base64Image.match(
        /^data:image\/([a-zA-Z+]+);base64,(.+)$/
      );

      if (!matches) {
        console.error("Invalid base64 image format");
        return;
      }

      const extension = matches[1].replace("+", "");
      const base64Data = matches[2];
      const imageBuffer = Buffer.from(base64Data, "base64");

      const imageFilename = `${reportId}-${timestamp}-annotated.${extension}`;
      const imageFilePath = path.join(this.resultsDir, imageFilename);

      await fs.writeFile(imageFilePath, imageBuffer);
      console.log(`Annotated image saved: ${imageFilename}`);
    } catch (error) {
      console.error("Failed to save annotated image:", error);
    }
  }

  /**
   * Get saved result by report ID
   */
  async getResultByReportId(
    reportId: string
  ): Promise<ModelPredictionResult | null> {
    try {
      const files = await fs.readdir(this.resultsDir);
      const resultFile = files.find((file) => file.startsWith(reportId));

      if (!resultFile) {
        return null;
      }

      const filePath = path.join(this.resultsDir, resultFile);
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to get result for report ${reportId}:`, error);
      return null;
    }
  }

  /**
   * Get path to annotated image for a report (if exists)
   */
  async getAnnotatedImagePath(reportId: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.resultsDir);
      const imageFile = files.find(
        (file) => file.startsWith(reportId) && file.includes("-annotated.")
      );

      if (!imageFile) {
        return null;
      }

      return path.join(this.resultsDir, imageFile);
    } catch (error) {
      console.error(
        `Failed to find annotated image for report ${reportId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Health check for model API
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.modelClient.health();
      return true;
    } catch (error) {
      console.error("Model API health check failed:", error);
      return false;
    }
  }
}

export const modelService = new ModelService();
