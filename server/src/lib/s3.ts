import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || '';

export async function uploadToS3(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<{ fileUrl: string; fileType: string }> {
  const ext = path.extname(originalName);
  const key = `${uuidv4()}${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    }),
  );

  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '') || '';
  const fileUrl = `${endpoint}/${BUCKET}/${key}`;

  return { fileUrl, fileType: mimeType };
}

export { s3Client };
