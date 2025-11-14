/** @format */

/**
 * Generic storage service interface for file operations
 * Can be implemented for various storage backends (local, S3, UploadThing, etc.)
 */
export interface StorageService {
  /**
   * Save a file to the storage
   * @param file - File buffer or stream
   * @param fileName - Name of the file to save
   * @param options - Additional options like folder path, metadata, etc.
   * @returns The URL or path where the file is stored
   */
  save(
    file: Buffer | NodeJS.ReadableStream,
    fileName: string,
    options?: StorageOptions
  ): Promise<string>;

  /**
   * Retrieve a file from storage
   * @param path - Path or identifier of the file
   * @returns File buffer or stream
   */
  get(path: string): Promise<Buffer | NodeJS.ReadableStream>;

  /**
   * Delete a file from storage
   * @param path - Path or identifier of the file
   * @returns Success status
   */
  delete(path: string): Promise<boolean>;

  /**
   * Check if a file exists in storage
   * @param path - Path or identifier of the file
   * @returns Existence status
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get the public URL for accessing the file
   * @param path - Path or identifier of the file
   * @returns Public URL to access the file
   */
  getUrl(path: string): string;

  /**
   * List files in a directory (optional, for storage types that support it)
   * @param directory - Directory path
   * @returns Array of file paths
   */
  list?(directory: string): Promise<string[]>;
}

/**
 * Options for storage operations
 */
export interface StorageOptions {
  /** Subdirectory or folder path */
  folder?: string;
  /** Content type/MIME type */
  contentType?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
  /** Whether to make the file public */
  isPublic?: boolean;
}
