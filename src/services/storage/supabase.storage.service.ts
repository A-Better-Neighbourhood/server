/** @format */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import {
  StorageService,
  StorageOptions,
} from "../../interfaces/storage.interface";
import { Readable } from "stream";

/**
 * Supabase Storage Service using S3-compatible API
 * Uses AWS SDK to interact with Supabase's S3-compatible storage
 */
export class SupabaseStorageService implements StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const accessKeyId = process.env.SB_ACCESS_KEY_ID;
    const secretAccessKey = process.env.SB_SECRET_ACCESS_KEY;
    const endpoint = process.env.SB_ENDPOINT_URL;
    const region = process.env.SB_REGION || "ap-south-1";

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      throw new Error(
        "Missing Supabase storage credentials. Please set SB_ACCESS_KEY_ID, SB_SECRET_ACCESS_KEY, and SB_ENDPOINT_URL"
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      forcePathStyle: true, // Required for S3-compatible services
    });

    // Extract bucket name and public URL from endpoint
    // Format: https://{project-id}.storage.supabase.co/storage/v1/s3
    const match = endpoint.match(/https:\/\/([^.]+)\.storage\.supabase\.co/);
    this.bucket = process.env.SB_BUCKET || "reports"; // Default bucket
    this.publicUrl = match
      ? `https://${match[1]}.supabase.co/storage/v1/object/public`
      : "";
  }

  /**
   * Save a file to Supabase storage
   */
  async save(
    file: Buffer | NodeJS.ReadableStream,
    fileName: string,
    options?: StorageOptions
  ): Promise<string> {
    try {
      const buffer = Buffer.isBuffer(file)
        ? file
        : await this.streamToBuffer(file);

      // Construct the full path with folder if provided
      const filePath = options?.folder
        ? `${options.folder}/${fileName}`
        : fileName;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: buffer,
        ContentType: options?.contentType || "application/octet-stream",
        ...(options?.metadata && { Metadata: options.metadata }),
      });

      await this.s3Client.send(command);

      return filePath;
    } catch (error) {
      console.error("Supabase upload error:", error);
      throw new Error(
        `Failed to upload file to Supabase: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get a file from Supabase storage
   */
  async get(path: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error("No file data received");
      }

      // Convert stream to buffer
      return await this.streamToBuffer(response.Body as Readable);
    } catch (error) {
      console.error("Supabase download error:", error);
      throw new Error(
        `Failed to download file from Supabase: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete a file from Supabase storage
   */
  async delete(path: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error("Supabase delete error:", error);
      return false;
    }
  }

  /**
   * Check if a file exists in Supabase storage
   */
  async exists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the public URL for accessing the file
   */
  getUrl(path: string): string {
    return `${this.publicUrl}/${this.bucket}/${path}`;
  }

  /**
   * Helper method to convert stream to buffer
   */
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }
}
