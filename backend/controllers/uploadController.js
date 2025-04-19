// Upload controller
import xlsx from "xlsx";
import { getUploadPath } from "../middleware/multerConfig.js";
import { pool } from "../config/database.js";

// Helper function to sanitize column names
const sanitizeColumnName = (col) =>
  col
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();

export const uploadController = {
  // Check if a table exists in the database
  checkTableExists: async (req, res) => {
    const client = await pool.connect();
    try {
      const tableName = req.query.name;

      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: "Table name is required",
          exists: false,
        });
      }

      const result = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
        [tableName]
      );
      const exists = result.rows[0].exists;

      return res.json({
        success: true,
        exists: exists,
        tableName: tableName,
      });
    } catch (error) {
      console.error("Error checking table exists:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
        exists: false,
      });
    } finally {
      client.release();
    }
  },
  processExcelFile: async (req, res) => {
    const client = await pool.connect();
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const tableName =
        req.body.tableName?.toLowerCase().replace(/\s+/g, "_") || "excel_data";

      // Check if forceOverwrite is set to true
      const forceOverwrite = req.body.forceOverwrite === "true";

      // Check if the table already exists
      const tableExistsResult = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
        [tableName]
      );
      const exists = tableExistsResult.rows[0].exists;

      if (exists && !forceOverwrite) {
        return res.status(409).json({
          success: false,
          message: `Table '${tableName}' already exists in the database`,
          tableExists: true,
          tableName,
        });
      }

      // If table exists and forceOverwrite is true, drop the table
      if (exists && forceOverwrite) {
        try {
          await client.query(`DROP TABLE IF EXISTS ${tableName}`);
          console.log(`Table '${tableName}' dropped for overwrite`);
        } catch (error) {
          console.error(`Error dropping table ${tableName}:`, error);
          return res.status(500).json({
            success: false,
            message: `Failed to drop existing table '${tableName}'`,
          });
        }
      }

      // Read Excel file
      const filePath = getUploadPath(req.file.filename);
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.SheetNames[0]; // Use first sheet
      const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);

      // Find valid row with data
      const sampleRow = rawData.find(
        (row) =>
          row &&
          Object.values(row).filter((v) => v !== null && v !== "").length > 0
      );

      if (!sampleRow) {
        throw new Error("No valid rows with data found in the Excel file");
      }

      // Process column names
      const originalColumns = Object.keys(sampleRow);
      const sanitizedColumns = originalColumns.map(sanitizeColumnName);

      // Create table with appropriate column types
      const columnDefs = sanitizedColumns.map((col, idx) => {
        const val = Object.values(sampleRow)[idx];
        if (typeof val === "number")
          return `${col} ${Number.isInteger(val) ? "INTEGER" : "NUMERIC"}`;
        if (val instanceof Date) return `${col} TIMESTAMP`;
        if (typeof val === "boolean") return `${col} BOOLEAN`;
        return `${col} TEXT`;
      });

      const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs.join(
        ", "
      )})`;
      await client.query(createTableQuery);

      // Insert data
      const originalToSanitized = {};
      Object.keys(sampleRow).forEach((key) => {
        originalToSanitized[key] = sanitizeColumnName(key);
      });

      let insertedCount = 0;
      let rejectedRowCount = 0;

      for (const row of rawData) {
        // Skip rows with less than 60% non-empty values
        const nonEmptyValuesCount = Object.values(row).filter(
          (v) => v !== null && v !== ""
        ).length;

        if (nonEmptyValuesCount / originalColumns.length < 0.6) {
          rejectedRowCount++; // Increment rejected row count
          continue; // Skip this row
        }

        const sanitizedRow = {};
        for (const key in originalToSanitized) {
          sanitizedRow[originalToSanitized[key]] = row[key] ?? null;
        }

        const placeholders = sanitizedColumns
          .map((_, i) => `$${i + 1}`)
          .join(", ");
        const values = sanitizedColumns.map((col) => sanitizedRow[col]);

        const insertQuery = `INSERT INTO ${tableName} (${sanitizedColumns.join(
          ", "
        )}) VALUES (${placeholders})`;
        await client.query(insertQuery, values);
        insertedCount++;
      }

      res.json({
        success: true,
        message: forceOverwrite
          ? `Existing table overwritten. ${insertedCount} rows inserted into ${tableName}`
          : `${insertedCount} rows inserted into ${tableName}`,
        tableName,
        rows: insertedCount,
        columns: sanitizedColumns,
        rejectedRows: rejectedRowCount, // Show the count of rejected rows
      });
    } catch (error) {
      console.error("Error in upload controller:", error);
      res.status(500).json({ success: false, message: error.message });
    } finally {
      client.release();
    }
  },
};
