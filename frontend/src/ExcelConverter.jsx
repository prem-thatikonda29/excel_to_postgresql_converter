// Excel to PostgreSQL converter component
import React, { useState, useEffect } from "react";

// API URL
const API_URL = "http://localhost:5500";
const DEFAULT_TABLE_NAME = "excel_data";

const ExcelConverter = () => {
  // State variables
  const [file, setFile] = useState(null);
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tableExists, setTableExists] = useState(false);
  const [existingTableName, setExistingTableName] = useState("");
  const [forceOverwrite, setForceOverwrite] = useState(false);
  const [checking, setChecking] = useState(false);

  // Check if default table exists when component mounts
  useEffect(() => {
    const checkDefaultTable = async () => {
      try {
        setChecking(true);
        const response = await fetch(
          `${API_URL}/table-exists?name=${DEFAULT_TABLE_NAME}`
        );
        const data = await response.json();

        if (data.exists) {
          // Only set the warning if user hasn't entered a table name
          if (!tableName || tableName.trim() === "") {
            setTableExists(true);
            setExistingTableName(DEFAULT_TABLE_NAME);
          }
        }
      } catch (err) {
        console.error("Error checking default table:", err);
      } finally {
        setChecking(false);
      }
    };

    checkDefaultTable();
  }, [tableName]);

  // Reset when tableName changes from default
  useEffect(() => {
    if (
      tableName &&
      tableName.trim() !== "" &&
      existingTableName === DEFAULT_TABLE_NAME
    ) {
      setTableExists(false);
      setExistingTableName("");
    }
  }, [tableName, existingTableName]);

  // Handle file input change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    // Reset states
    setError(null);
    setResult(null);
    setTableExists(false);
    setExistingTableName("");
    setForceOverwrite(false);
  };

  // Handle table name input change
  const handleTableNameChange = (e) => {
    setTableName(e.target.value);
    // Reset error state when table name changes
    if (tableExists) {
      setTableExists(false);
      setError(null);
    }
  };

  // Handle force overwrite checkbox change
  const handleForceOverwriteChange = (e) => {
    setForceOverwrite(e.target.checked);
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Determine the actual table name to use
    const effectiveTableName = tableName.trim() || DEFAULT_TABLE_NAME;

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tableName", effectiveTableName);

      if (forceOverwrite) {
        formData.append("forceOverwrite", "true");
      }

      console.log("Sending file:", file.name);

      // Make API request
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
        mode: "cors",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        setResult(data);
        setTableExists(false);
        setExistingTableName("");
      } else if (response.status === 409) {
        // Handle table already exists case
        setTableExists(true);
        setExistingTableName(data.tableName);
        setError(
          `Table '${data.tableName}' already exists. You can choose a different name or force overwrite.`
        );
      } else {
        setError(`Server error: ${data.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Determine if we're using the default table name
  const isUsingDefaultTableName = !tableName || tableName.trim() === "";

  return (
    <div className="excel-converter">
      {/* Upload Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="file">Select Excel File:</label>
          <input
            type="file"
            id="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tableName">Table Name:</label>
          <input
            type="text"
            id="tableName"
            value={tableName}
            onChange={handleTableNameChange}
            placeholder="Default: excel_data"
            className={tableExists ? "input-error" : ""}
          />
          {isUsingDefaultTableName && (
            <p className="info-hint">
              No table name provided. The default "excel_data" will be used.
            </p>
          )}
          {tableExists && (
            <p className="error-hint">
              Table '{existingTableName}' already exists
            </p>
          )}
        </div>

        {tableExists && (
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="forceOverwrite"
              checked={forceOverwrite}
              onChange={handleForceOverwriteChange}
            />
            <label htmlFor="forceOverwrite">
              Force overwrite (Warning: This will delete the existing table)
            </label>
          </div>
        )}

        <button type="submit" disabled={loading || checking}>
          {loading ? "Processing..." : "Upload and Convert"}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="result">
          <h3>Success!</h3>
          <p>{result.message}</p>

          <div className="details">
            <p>Processed {result.rows} rows</p>
            <p>Rejected {result.rejectedRows} rows</p>
            <p>Table name: {result.tableName}</p>

            {result.columns && result.columns.length > 0 && (
              <div>
                <p>Columns:</p>
                <ul>
                  {result.columns.map((col, index) => (
                    <li key={index}>{col}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelConverter;
