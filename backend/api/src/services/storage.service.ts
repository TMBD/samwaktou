/**
 * @file storage.service.ts
 * @description Wrapper around AWS S3 (v3 SDK) for audio file storage.
 *
 * Capabilities:
 * - **Upload** a file buffer to S3.
 * - **Partial download** (byte-range GET) for audio streaming.
 * - **Full download** as a piped stream.
 * - **Metadata** retrieval (HEAD request — content-length, content-type …).
 * - **Delete** a single object.
 * - **Bulk download** all audio files as a ZIP archive.
 *
 * The S3 client is lazily initialised on first use and cached for the
 * lifetime of the process. In development, it can target a local
 * S3-compatible service (LocalStack, MinIO) via the `S3_HOST` env var.
 */

import { PassThrough } from 'node:stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import type { HeadObjectCommandOutput, DeleteObjectCommandOutput } from '@aws-sdk/client-s3';
import archiver from 'archiver';
import type { Readable } from 'node:stream';

import { getEnv } from '../config/env.config.js';
import { FILE_LOCATION } from '../config/constants.js';

/* ── S3 client singleton ──────────────────────────────────────────────── */

/** Module-level cache — the client is created once on first access. */
let s3Client: S3Client | null = null;

/**
 * Return (and lazily create) the S3 client singleton.
 *
 * - **Production**: connects to the real AWS region (`eu-west-3`).
 * - **Development**: when `S3_HOST` is set, connects to a local
 *   S3-compatible endpoint with path-style addressing.
 *
 * The resolved bucket name is stored on the client instance as
 * `_bucketName` so it only needs to be parsed once.
 */
function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const env = getEnv();
  const isDevProfile = env.PROFILE !== 'production';
  const bucketArn = env.S3_ACCESS_POINT_ARN;

  const config: ConstructorParameters<typeof S3Client>[0] = {
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    region: 'eu-west-3',
  };

  // In dev, override endpoint and region to point at the local S3 mock.
  if (isDevProfile && env.S3_HOST) {
    config.endpoint = env.S3_HOST;
    config.forcePathStyle = true;   // Required for LocalStack / MinIO.
    config.region = 'us-east-1';    // Dummy region for local services.
  }

  s3Client = new S3Client(config);

  // Extract the bucket name from the ARN (format: "arn:…:accesspoint/name")
  // or use the raw value if it is already a plain bucket name.
  const bucketName = bucketArn.includes(':')
    ? bucketArn.split(':').pop() ?? bucketArn
    : bucketArn;

  // Stash the bucket name on the client for cheap reuse.
  (s3Client as S3Client & { _bucketName: string })._bucketName = bucketName;

  return s3Client;
}

/** Retrieve the resolved bucket name from the cached S3 client. */
function getBucketName(): string {
  const client = getS3Client() as S3Client & { _bucketName?: string };
  return client._bucketName ?? getEnv().S3_ACCESS_POINT_ARN;
}

/* ── Service class ────────────────────────────────────────────────────── */

export class StorageService {
  /**
   * Upload a file buffer to S3 under the standard audio prefix.
   *
   * @param data     - Raw file content as a Node.js `Buffer`.
   * @param fileName - File name (without path prefix). Example: "1714000000_sermon.mp3".
   * @returns The full S3 object key (e.g. "files/audios/1714000000_sermon.mp3").
   */
  async uploadFile(data: Buffer, fileName: string): Promise<string> {
    const client = getS3Client();
    const key = FILE_LOCATION.AUDIO_FILE_LOCATION + fileName;

    await client.send(
      new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        Body: data,
      }),
    );

    return key;
  }

  /**
   * Download a byte range of a file — used for HTTP range-request audio streaming.
   *
   * @param fileName  - File name (without path prefix).
   * @param startByte - First byte of the range (inclusive).
   * @param endByte   - Last byte of the range (inclusive).
   * @returns The requested byte slice as a `Uint8Array`.
   */
  async getFile(fileName: string, startByte: number, endByte: number): Promise<Uint8Array> {
    const client = getS3Client();
    const key = FILE_LOCATION.AUDIO_FILE_LOCATION + fileName;

    const response = await client.send(
      new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        Range: `bytes=${startByte}-${endByte}`,
      }),
    );

    // Collect the streamed response body into a single Uint8Array.
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    return new Uint8Array(Buffer.concat(chunks));
  }

  /**
   * Retrieve S3 object metadata (content-length, content-type, etc.)
   * without downloading the file body.
   */
  async getFileMetadata(fileName: string): Promise<HeadObjectCommandOutput> {
    const client = getS3Client();
    const key = FILE_LOCATION.AUDIO_FILE_LOCATION + fileName;

    return client.send(
      new HeadObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      }),
    );
  }

  /** Delete a single audio file from S3. */
  async deleteFile(fileName: string): Promise<DeleteObjectCommandOutput> {
    const client = getS3Client();
    const key = FILE_LOCATION.AUDIO_FILE_LOCATION + fileName;

    return client.send(
      new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      }),
    );
  }

  /**
   * Download a complete audio file as a readable stream.
   *
   * The S3 response body is piped through a `PassThrough` so the caller
   * can attach it directly to an Express response.
   */
  async downloadFile(fileName: string): Promise<PassThrough> {
    const client = getS3Client();
    const key = FILE_LOCATION.AUDIO_FILE_LOCATION + fileName;

    const response = await client.send(
      new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      }),
    );

    const passThrough = new PassThrough();
    const stream = response.Body as Readable;
    stream.pipe(passThrough);
    return passThrough;
  }

  /**
   * Download **all** audio files as a single ZIP archive.
   *
   * Flow:
   * 1. List every object under the audio prefix.
   * 2. Stream each object into an `archiver` ZIP (max compression).
   * 3. Pipe the archive output through a `PassThrough` stream.
   *
   * The returned stream can be piped directly into an Express response
   * with `Content-Type: application/zip`.
   */
  async downloadAll(): Promise<PassThrough> {
    const client = getS3Client();
    const bucket = getBucketName();
    const prefix = FILE_LOCATION.AUDIO_FILE_LOCATION;

    // 1. List all objects under the audio prefix.
    const listResponse = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      }),
    );

    // 2. Create a ZIP archive with max zlib compression.
    const archive = archiver('zip', { zlib: { level: 9 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    const objects = listResponse.Contents ?? [];

    // 3. Stream each S3 object into the archive.
    for (const obj of objects) {
      if (!obj.Key) continue;

      const response = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: obj.Key,
        }),
      );

      // Strip the prefix so the archive contains only file names.
      const fileName = obj.Key.replace(prefix, '');
      archive.append(response.Body as Readable, { name: fileName });
    }

    await archive.finalize();
    return passThrough;
  }
}
