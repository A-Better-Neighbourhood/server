/** @format */

/**
 * Example usage of ImageService with LocalStorageService
 *
 * This file demonstrates how to initialize and use the image service
 * with different storage backends.
 */

import { ImageService } from "./image.service";
import { LocalStorageService } from "./storage";

// Example 1: Using LocalStorageService
export const createLocalImageService = () => {
  const localStorage = new LocalStorageService("uploads", "/uploads");
  return new ImageService(localStorage);
};

// Example 2: Custom local storage configuration
export const createCustomImageService = () => {
  const localStorage = new LocalStorageService(
    "public/images", // Store in public/images folder
    "/static/images" // Serve from /static/images URL
  );
  return new ImageService(localStorage);
};

/**
 * Example usage in a controller:
 *
 * const imageService = createLocalImageService();
 *
 * // Upload an image
 * const result = await imageService.uploadImage(
 *   fileBuffer,
 *   "profile-pic.jpg",
 *   "image/jpeg",
 *   "profiles"
 * );
 * console.log(result.url); // Public URL to access the image
 * console.log(result.path); // Internal path for storage reference
 *
 * // Get image URL
 * const url = imageService.getImageUrl(result.path);
 *
 * // Delete an image
 * await imageService.deleteImage(result.path);
 *
 * // List all images in a folder
 * const images = await imageService.listImages("profiles");
 */

/**
 * Future: S3 Storage Example
 *
 * import { S3StorageService } from "./storage";
 *
 * export const createS3ImageService = () => {
 *   const s3Storage = new S3StorageService({
 *     bucket: "my-bucket",
 *     region: "us-east-1",
 *     credentials: {
 *       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
 *     }
 *   });
 *   return new ImageService(s3Storage);
 * };
 */
