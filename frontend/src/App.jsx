// Main App component
import React from "react";
import ExcelConverter from "./ExcelConverter";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Excel to PostgreSQL Converter</h1>
        <p>Upload Excel files and convert them to PostgreSQL tables</p>
      </header>
      <main>
        <ExcelConverter />
      </main>
    </div>
  );
}

export default App;
