// src/App.js
import React, { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTableNameChange = (e) => {
    setTableName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!tableName) {
      setTableName("excel_data");
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tableName", tableName);

    try {
      console.log("Sending file:", file.name);
      const response = await fetch("http://localhost:5500/upload", {
        method: "POST",
        body: formData,
        mode: "cors",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Response status:", response.status); // Debug log
      const data = await response.json();
      console.log("Response data:", data); // Debug log

      if (response.ok) {
        setResult(data);
      } else {
        setError(`Server error: ${data.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Full error:", err); // Detailed error log
      setError(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Excel to PostgreSQL Converter</h1>
        <p>Upload Excel files and convert them to PostgreSQL tables</p>
      </header>

      <main>
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
            <label htmlFor="tableName">Table Name (optional):</label>
            <input
              type="text"
              id="tableName"
              value={tableName}
              onChange={handleTableNameChange}
              placeholder="Default: excel_data"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Upload and Convert"}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result">
            <h3>Success!</h3>
            <p>{result.message}</p>
            <div className="details">
              <p>Processed {result.rows} rows</p>
              <p>Table name: {result.tableName}</p>
              <div>
                <p>Columns:</p>
                <ul>
                  {result.columns.map((col, index) => (
                    <li key={index}>{col}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
