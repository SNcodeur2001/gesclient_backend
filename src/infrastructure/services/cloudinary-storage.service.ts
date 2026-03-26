import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'crypto';
import { request } from 'https';
import { URL } from 'url';

@Injectable()
export class CloudinaryStorageService {
  private readonly enabled: boolean;
  private readonly folder: string;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    this.folder = process.env.CLOUDINARY_FOLDER || 'factures';
    this.enabled = Boolean(cloudName && apiKey && apiSecret);

    if (this.enabled) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async uploadPdf(
    buffer: Buffer,
    filename: string,
  ): Promise<{ url: string; publicId: string }> {
    if (!this.enabled) {
      throw new Error('Cloudinary non configuré');
    }

    const safeName = filename.replace(/\.pdf$/i, '');
    const publicId = `${safeName}-${randomUUID().slice(0, 8)}`;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          type: 'private',
          folder: this.folder,
          public_id: publicId,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            const err =
              error instanceof Error
                ? error
                : new Error(
                    typeof error === 'string'
                      ? error
                      : 'Upload Cloudinary échoué',
                  );
            reject(err);
            return;
          }
          resolve(uploadResult);
        },
      );
      stream.end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async downloadPdf(publicId: string): Promise<Buffer> {
    if (!this.enabled) {
      throw new Error('Cloudinary non configuré');
    }

    const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'raw',
    });

    return this.fetchBuffer(signedUrl);
  }

  private async fetchBuffer(urlString: string): Promise<Buffer> {
    const url = new URL(urlString);

    return new Promise((resolve, reject) => {
      const req = request(
        {
          method: 'GET',
          protocol: url.protocol,
          hostname: url.hostname,
          path: url.pathname + url.search,
        },
        (res) => {
          if (!res.statusCode) {
            reject(new Error('Réponse invalide Cloudinary'));
            return;
          }

          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            this.fetchBuffer(res.headers.location).then(resolve).catch(reject);
            return;
          }

          if (res.statusCode >= 400) {
            reject(
              new Error(`Téléchargement Cloudinary échoué: ${res.statusCode}`),
            );
            return;
          }

          const chunks: Buffer[] = [];
          res.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          res.on('end', () => resolve(Buffer.concat(chunks)));
        },
      );

      req.on('error', reject);
      req.end();
    });
  }
}
