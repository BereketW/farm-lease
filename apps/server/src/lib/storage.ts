import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer, { type StorageEngine } from "multer";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");

// Ensure the upload directory exists on boot
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

function safeName(original: string) {
  const ext = path.extname(original).toLowerCase().slice(0, 10);
  const stem = crypto.randomBytes(12).toString("hex");
  return `${stem}${ext}`;
}

function makeStorage(subdir: string): StorageEngine {
  const dir = path.join(UPLOAD_ROOT, subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => cb(null, safeName(file.originalname)),
  });
}

const DOC_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export const documentUpload = multer({
  storage: makeStorage("documents"),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB each, up to 10 files
  fileFilter: (_req, file, cb) => {
    if (DOC_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported document type: ${file.mimetype}`));
  },
});

export const receiptUpload = multer({
  storage: makeStorage("receipts"),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME.has(file.mimetype) || file.mimetype === "application/pdf") {
      return cb(null, true);
    }
    cb(new Error(`Unsupported receipt type: ${file.mimetype}`));
  },
});

/** Turn a Multer-generated filename into a public URL under /uploads/<subdir>/<file>. */
export function fileToPublicUrl(subdir: string, filename: string): string {
  const origin = process.env.PUBLIC_SERVER_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  return `${origin}/uploads/${subdir}/${filename}`;
}

export { UPLOAD_ROOT };
