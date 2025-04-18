import express from "express";
import cors from "cors";
import multer from "multer";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import xlsx from "xlsx";
import { dirname } from "path";

import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    credentials: true,
  })
);

// Temporary superuser config for testing
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
};

// After creating the pool
const pool = new pg.Pool(dbConfig);

// Add database connection test
pool
  .connect()
  .then((client) => {
    console.log("Database connected successfully");
    client.release();
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// Upload configuration
const UPLOAD_FOLDER = "uploads";
const ALLOWED_EXTENSIONS = new Set(["xlsx", "xls", "csv"]);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_FOLDER);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

// Helper functions
const createTableFromDataFrame = async (data, tableName) => {
  const client = await pool.connect();
  try {
    const columns = Object.keys(data[0]).map((col) => {
      const value = data[0][col];
      let type = "TEXT";
      if (typeof value === "number") {
        type = Number.isInteger(value) ? "INTEGER" : "NUMERIC";
      } else if (value instanceof Date) {
        type = "TIMESTAMP";
      } else if (typeof value === "boolean") {
        type = "BOOLEAN";
      }
      return `"${col.replace(/ /g, "_").toLowerCase()}" ${type}`;
    });

    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(
      ", "
    )})`;
    await client.query(createTableQuery);
    return true;
  } catch (error) {
    console.error("Error creating table:", error);
    throw error;
  } finally {
    client.release();
  }
};

const insertDataToTable = async (data, tableName) => {
  const client = await pool.connect();
  try {
    const columns = Object.keys(data[0]);
    const values = data.map((row) => Object.values(row));

    for (const row of values) {
      const placeholders = row.map((_, i) => `$${i + 1}`).join(", ");
      const query = `INSERT INTO ${tableName} ("${columns.join(
        '", "'
      )}") VALUES (${placeholders})`;
      await client.query(query, row);
    }
    return values.length;
  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Routes
app.get("/test", (req, res) => {
  res.json({ message: "Server is running" });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("Received upload request");
    if (!req.file) {
      console.log("No file in request");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    console.log("File received:", req.file.filename);
    const tableName = req.body.tableName || "excel_data";
    const filePath = path.join(__dirname, UPLOAD_FOLDER, req.file.filename);

    console.log("Reading file:", filePath);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log("Creating table:", tableName);
    await createTableFromDataFrame(data, tableName);

    console.log("Inserting data");
    const rowCount = await insertDataToTable(data, tableName);

    res.json({
      success: true,
      message: "File uploaded and processed successfully",
      rows: rowCount,
      columns: Object.keys(data[0]),
      tableName,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).json({
      success: false,
      message: `Error processing file: ${error.message}`,
      details: error.stack,
    });
  }
});

const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
