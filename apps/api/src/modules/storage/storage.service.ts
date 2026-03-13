import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  etag?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('storage.r2.accountId');
    const accessKeyId = this.configService.get<string>('storage.r2.accessKeyId');
    const secretAccessKey = this.configService.get<string>('storage.r2.secretAccessKey');

    this.bucket = this.configService.get<string>('storage.r2.bucket', 'facturado');
    this.publicUrl = this.configService.get<string>('storage.r2.publicUrl', '');

    // Cloudflare R2 uses AWS S3-compatible API
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId ?? '', secretAccessKey: secretAccessKey ?? '' },
    });
  }

  /**
   * Uploads a file to Cloudflare R2.
   */
  async upload(
    key: string,
    data: Buffer | Readable,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<UploadResult> {
    const body = data instanceof Buffer ? data : await this.streamToBuffer(data);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    });

    const result = await this.s3Client.send(command);

    this.logger.debug(`Uploaded file: ${key} (${body.length} bytes)`);

    return {
      key,
      url: this.getPublicUrl(key),
      size: body.length,
      contentType,
      etag: result.ETag,
    };
  }

  /**
   * Downloads a file from Cloudflare R2.
   */
  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const result = await this.s3Client.send(command);

    if (!result.Body) {
      throw new Error(`File not found: ${key}`);
    }

    return this.streamToBuffer(result.Body as Readable);
  }

  /**
   * Deletes a file from Cloudflare R2.
   */
  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    await this.s3Client.send(command);
    this.logger.debug(`Deleted file: ${key}`);
  }

  /**
   * Generates a pre-signed URL for temporary access to a file.
   */
  async getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Generates a pre-signed URL for uploading directly from the client.
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Checks if a file exists.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({ Bucket: this.bucket, Key: key });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lists files under a prefix.
   */
  async list(prefix: string, maxKeys = 100): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });
    const result = await this.s3Client.send(command);
    return (result.Contents ?? []).map((obj) => obj.Key ?? '').filter(Boolean);
  }

  /**
   * Copies a file within the bucket.
   */
  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destinationKey,
    });
    await this.s3Client.send(command);
  }

  private getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return key;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
