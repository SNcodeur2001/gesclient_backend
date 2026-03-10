import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class FileStorageService {
  private readonly uploadDir: string;

  constructor() {
    // Store files in a dedicated directory
    this.uploadDir = join(process.cwd(), 'uploads', 'factures');
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  /**
   * Save a buffer to disk and return the file path
   */
  async saveFile(buffer: Buffer, filename: string): Promise<string> {
    // Generate unique filename to prevent collisions
    const uniqueFilename = `${randomUUID()}-${filename}`;
    const filePath = join(this.uploadDir, uniqueFilename);
    
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Read a file from disk and return as buffer
   */
  async readFile(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
  }

  /**
   * Delete a file from disk
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File may not exist, ignore error
      console.warn(`Failed to delete file: ${filePath}`, error);
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the upload directory path
   */
  getUploadDir(): string {
    return this.uploadDir;
  }
}
