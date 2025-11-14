/** @format */

import { StorageService } from "../interfaces/storage.interface";
import crypto from "crypto";
import path from "path";

/**
 * Image service for handling image uploads and management
 * Uses a storage service implementation for actual storage operations
 */
export class ImageService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Generate a unique filename for an image
   */
  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString("hex");
    return `${timestamp}-${randomHash}${ext}`;
  }

  /**
   * Validate if the file is an image
   */
  private isValidImageType(mimeType: string): boolean {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    return validTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Upload an image
   * @param file - Image file buffer or stream
   * @param originalName - Original filename
   * @param mimeType - MIME type of the image
   * @param folder - Optional folder to store the image in
   * @returns Object containing file path and URL
   */
  async uploadImage(
    file: Buffer | NodeJS.ReadableStream,
    originalName: string,
    mimeType: string,
    folder: string = "images"
  ): Promise<{ path: string; url: string }> {
    // Validate image type
    if (!this.isValidImageType(mimeType)) {
      throw new Error(
        "Invalid image type. Allowed types: JPEG, PNG, GIF, WebP, SVG"
      );
    }

    // Generate unique filename
    const fileName = this.generateFileName(originalName);

    // Save the image
    const filePath = await this.storageService.save(file, fileName, {
      folder,
      contentType: mimeType,
      isPublic: true,
    });

    // Get the public URL
    const url = this.storageService.getUrl(filePath);

    return { path: filePath, url };
  }

  /**
   * Delete an image
   * @param filePath - Path to the image file
   * @returns Success status
   */
  async deleteImage(filePath: string): Promise<boolean> {
    return await this.storageService.delete(filePath);
  }

  /**
   * Get an image
   * @param filePath - Path to the image file
   * @returns Image buffer
   */
  async getImage(filePath: string): Promise<Buffer | NodeJS.ReadableStream> {
    const exists = await this.storageService.exists(filePath);
    if (!exists) {
      throw new Error("Image not found");
    }
    return await this.storageService.get(filePath);
  }

  /**
   * Get image URL
   * @param filePath - Path to the image file
   * @returns Public URL
   */
  getImageUrl(filePath: string): string {
    return this.storageService.getUrl(filePath);
  }

  /**
   * List images in a folder
   * @param folder - Folder path
   * @returns Array of image paths
   */
  async listImages(folder: string = "images"): Promise<string[]> {
    if (this.storageService.list) {
      return await this.storageService.list(folder);
    }
    throw new Error("List operation not supported by storage service");
  }
}
