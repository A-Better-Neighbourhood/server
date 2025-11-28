/** @format */

import { ModelApiClient } from "./model.client.js";
import { LocalStorageService } from "../storage/index.js";
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
   * Adjust this logic based on actual model response structure
   */
  private evaluatePrediction(prediction: any): boolean {
    // Example logic - adjust based on actual model response
    if (prediction.confidence && prediction.confidence > 0.5) {
      return true;
    }

    if (prediction.detected_objects && prediction.detected_objects.length > 0) {
      return true;
    }

    if (prediction.predictions) {
      // Add logic based on predictions structure
      return true;
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
      const filename = `${reportId}-${Date.now()}.json`;
      const filePath = path.join(this.resultsDir, filename);

      await fs.writeFile(filePath, JSON.stringify(result, null, 2), "utf-8");
      console.log(`Model prediction result saved: ${filename}`);
    } catch (error) {
      console.error("Failed to save model result:", error);
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
