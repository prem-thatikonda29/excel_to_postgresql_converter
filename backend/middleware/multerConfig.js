// Multer configuration for file uploads
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOAD_FOLDER = path.join(dirname(__dirname), "uploads");
const ALLOWED_EXTENSIONS = new Set(["xlsx", "xls", "csv"]);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => cb(null, file.originalname),
});

// Configure multer
export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    cb(null, ALLOWED_EXTENSIONS.has(ext));
  },
});

export const getUploadPath = (filename) => path.join(UPLOAD_FOLDER, filename);
