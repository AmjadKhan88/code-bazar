import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export interface UploadResult {
  url: string;
  publicId: string;
  storage: "cloudinary" | "local";
}

export async function uploadImageBuffer(
  buffer: Buffer,
  originalName: string,
  folder = "codebazaar/payment-screenshots"
): Promise<UploadResult> {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    return new Promise<UploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed."));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            storage: "cloudinary",
          });
        }
      );
      stream.end(buffer);
    });
  }

  // Local fallback when Cloudinary credentials in .env are still empty
  const ext = path.extname(originalName) || ".png";
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "payments");
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), buffer);

  return {
    url: `/uploads/payments/${filename}`,
    publicId: filename,
    storage: "local",
  };
}
