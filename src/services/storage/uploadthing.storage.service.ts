/** @format */

import { UTApi } from "uploadthing/server";
import {
  StorageService,
  StorageOptions,
} from "../../interfaces/storage.interface";

/**
 * UploadThing cloud storage implementation
 * Stores files in UploadThing cloud storage
 */
export class UploadThingStorageService implements StorageService {
  private utapi: UTApi;

  constructor() {
    // UTApi will automatically use UPLOADTHING_TOKEN from environment
    this.utapi = new UTApi();
  }

  /**
   * Save a file to UploadThing cloud storage
   */
  async save(
    file: Buffer | NodeJS.ReadableStream,
    fileName: string,
    options?: StorageOptions
  ): Promise<string> {
    try {
      // Convert stream to buffer if needed
      let buffer: Buffer;
      if (Buffer.isBuffer(file)) {
        buffer = file;
      } else {
        buffer = await this.streamToBuffer(file);
      }

      // Create a File object from the buffer
      const blob = new Blob([buffer], {
        type: options?.contentType || "application/octet-stream",
      });
      const uploadFile = new File([blob], fileName, {
        type: options?.contentType || "application/octet-stream",
      });

      // Upload to UploadThing
      const response = await this.utapi.uploadFiles(uploadFile);

      if (response.error) {
        throw new Error(`Upload failed: ${response.error.message}`);
      }

      // Return the file key (used for later operations)
      return response.data.key;
    } catch (error) {
      console.error("UploadThing upload error:", error);
      throw new Error(
        `Failed to upload file to UploadThing: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Retrieve a file from UploadThing (downloads the file)
   * Note: This fetches the file from the URL and returns the buffer
   */
  async get(fileKey: string): Promise<Buffer> {
    try {
      const url = this.getUrl(fileKey);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("UploadThing get error:", error);
      throw new Error(
        `Failed to retrieve file from UploadThing: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete a file from UploadThing cloud storage
   */
  async delete(fileKey: string): Promise<boolean> {
    try {
      const response = await this.utapi.deleteFiles(fileKey);

      if (!response.success) {
        console.error("Failed to delete file:", fileKey);
        return false;
      }

      return true;
    } catch (error) {
      console.error("UploadThing delete error:", error);
      return false;
    }
  }

  /**
   * Check if a file exists in UploadThing
   * Note: UploadThing doesn't have a direct "exists" method,
   * so we try to get file info and catch errors
   */
  async exists(fileKey: string): Promise<boolean> {
    try {
      const url = this.getUrl(fileKey);
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the public URL for accessing the file
   */
  getUrl(fileKey: string): string {
    // UploadThing URLs follow the pattern: https://utfs.io/f/{fileKey}
    return `https://utfs.io/f/${fileKey}`;
  }

  /**
   * List files (not supported by UploadThing's basic API)
   */
  async list(directory: string): Promise<string[]> {
    throw new Error(
      "List operation is not supported by UploadThing storage service"
    );
  }

  /**
   * Helper method to convert stream to buffer
   */
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }
}
