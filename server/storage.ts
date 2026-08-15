import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

let s3Client: S3Client | null = null;

function requireStorageConfig(): { bucket: string; region: string } {
  if (!ENV.portalS3Bucket || !ENV.portalS3Region) {
    throw new Error("S3 storage is not configured. Set PORTAL_S3_BUCKET and PORTAL_S3_REGION.");
  }
  return { bucket: ENV.portalS3Bucket, region: ENV.portalS3Region };
}

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: ENV.portalS3Region,
      credentials: ENV.awsAccessKeyId && ENV.awsSecretAccessKey
        ? {
            accessKeyId: ENV.awsAccessKeyId,
            secretAccessKey: ENV.awsSecretAccessKey,
            ...(ENV.awsSessionToken ? { sessionToken: ENV.awsSessionToken } : {}),
          }
        : undefined,
    });
  }
  return s3Client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  return lastDot === -1 ? `${relKey}_${hash}` : `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { bucket } = requireStorageConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
    ServerSideEncryption: "aws:kms",
  }));
  return { key, url: await storageGetSignedUrl(key) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: await storageGetSignedUrl(key) };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { bucket } = requireStorageConfig();
  const key = normalizeKey(relKey);
  return getSignedUrl(getS3Client(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 900 });
}

export function resetS3ClientForTests(): void {
  s3Client = null;
}
