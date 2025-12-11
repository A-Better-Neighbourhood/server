/** @format */

import fs from "fs";
import path from "path";
import { promisify } from "util";
import {
  StorageService,
  StorageOptions,
} from "../../interfaces/storage.interface";

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);  
const access = promisify(fs.access);
const readdir = promisify(fs.readdir);

/**
 * Local file system storage implementation
 * Stores files in a local directory on the server
 */
export class LocalStorageService implements StorageService {
  private baseDir: string;
  private baseUrl: string;

  /**
   * @param baseDir - Base directory for storing files (default: 'uploads')
   * @param baseUrl - Base URL for accessing files (default: '/uploads')
   */
  constructor(baseDir: string = "uploads", baseUrl: string = "/uploads") {
    this.baseDir = path.resolve(baseDir);
    this.baseUrl = baseUrl;
    this.ensureBaseDirectory();
  }

  /**
   * Ensure the base directory exists
   */
  private async ensureBaseDirectory(): Promise<void> {
    try {
      await access(this.baseDir, fs.constants.F_OK);
    } catch {
      await mkdir(this.baseDir, { recursive: true });
    }
  }

  /**
   * Ensure a directory exists
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await access(dirPath, fs.constants.F_OK);
    } catch {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Get the full file path
   */
  private getFilePath(fileName: string, folder?: string): string {
    if (folder) {
      return path.join(this.baseDir, folder, fileName);
    }
    return path.join(this.baseDir, fileName);
  }

  /**
   * Save a file to local storage
   */
  async save(
    file: Buffer | NodeJS.ReadableStream,
    fileName: string,
    options?: StorageOptions
  ): Promise<string> {
    const filePath = this.getFilePath(fileName, options?.folder);
    const directory = path.dirname(filePath);

    await this.ensureDirectory(directory);

    if (Buffer.isBuffer(file)) {
      await writeFile(filePath, file);
    } else {
      const writeStream = fs.createWriteStream(filePath);
      await new Promise<void>((resolve, reject) => {
        file.pipe(writeStream);
        writeStream.on("finish", () => resolve());
        writeStream.on("error", reject);
      });
    }

    return path.relative(this.baseDir, filePath);
  }

  /**
   * Retrieve a file from local storage
   */
  async get(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath);
    return await readFile(fullPath);
  }

  /**
   * Delete a file from local storage
   */
  async delete(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      await unlink(fullPath);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * Check if a file exists in local storage
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      await access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the public URL for accessing the file
   */
  getUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath.replace(/\\/g, "/")}`;
  }

  /**
   * List files in a directory
   */
  async list(directory: string = ""): Promise<string[]> {
    const fullPath = path.join(this.baseDir, directory);
    try {
      const files = await readdir(fullPath);
      return files.map((file) => path.join(directory, file));
    } catch (error) {
      console.error("Error listing directory:", error);
      return [];
    }
  }
}
