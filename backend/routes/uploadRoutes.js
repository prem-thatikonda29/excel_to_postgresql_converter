// Upload routes
import express from "express";
import { uploadController } from "../controllers/uploadController.js";
import { upload } from "../middleware/multerConfig.js";

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "✅ Server is running" });
});

// Check if table exists route
router.get("/table-exists", uploadController.checkTableExists);

// Upload Excel file route
router.post(
  "/upload",
  upload.single("file"),
  uploadController.processExcelFile
);

export default router;
