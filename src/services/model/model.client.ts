/** @format */

import axios, { AxiosResponse } from "axios";
import FormData from "form-data";

interface PredictionResponse {
  predictions?: any;
  confidence?: number;
  detected_objects?: any[];
  // Add more fields based on actual API response
}

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface HTTPValidationError {
  detail: ValidationError[];
}

export class ModelApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.MODEL_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * Health check endpoint
   */
  async health(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Health check failed: ${error.response?.status} ${error.response?.statusText}`
        );
      }
      throw error;
    }
  }

  /**
   * Predict pothole from image buffer
   */
  async predict(
    imageBuffer: Buffer,
    filename: string,
    mimeType: string,
    confThreshold: number = 0.25
  ): Promise<PredictionResponse> {
    const formData = new FormData();
    formData.append("file", imageBuffer, {
      filename,
      contentType: mimeType,
    });

    try {
      const response: AxiosResponse<PredictionResponse> = await axios.post(
        `${this.baseUrl}/predict`,
        formData,
        {
          params: {
            conf_threshold: confThreshold,
          },
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422) {
          const validationError: HTTPValidationError = error.response.data;
          throw new Error(
            `Validation error: ${JSON.stringify(validationError.detail)}`
          );
        }
        throw new Error(
          `Prediction failed: ${error.response?.status} ${error.response?.statusText}`
        );
      }
      throw error;
    }
  }
}
