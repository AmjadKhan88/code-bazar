import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import multer from "multer";

const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max screenshot
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(new Error("Only PNG, JPEG, or WebP screenshots are allowed."));
      return;
    }
    cb(null, true);
  },
});

export interface ParsedMultipartResult {
  file: Express.Multer.File | undefined;
  fields: Record<string, string>;
}

/**
 * Parses a Next.js App Router multipart/form-data Request using Multer memoryStorage.
 */
export async function parseMultipartWithMulter(
  req: Request,
  fieldName: string
): Promise<ParsedMultipartResult> {
  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const stream = Readable.from(buffer) as unknown as IncomingMessage & {
    headers: Record<string, string>;
    body?: Record<string, string>;
    file?: Express.Multer.File;
  };

  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key.toLowerCase()] = value;
  });
  stream.headers = headersObj;

  return new Promise<ParsedMultipartResult>((resolve, reject) => {
    const middleware = upload.single(fieldName);
    const fakeRes = {} as ServerResponse;

    middleware(stream, fakeRes, (err: unknown) => {
      if (err) {
        reject(err instanceof Error ? err : new Error("File upload error"));
        return;
      }
      resolve({
        file: stream.file,
        fields: (stream.body || {}) as Record<string, string>,
      });
    });
  });
}
