import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
export const createS3Client = () => {
  let s3Client;
  return () => {
    if (!s3Client) {
      s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION });
    }

    return s3Client;
  }
}