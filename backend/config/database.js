// database.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
};

const pool = new pg.Pool(config);

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Database connected successfully");
    client.release();
    return true;
  } catch (err) {
    console.error("Database connection error:", err);
    return false;
  }
};

export { pool, testConnection };
