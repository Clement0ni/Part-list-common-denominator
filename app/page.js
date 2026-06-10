"use client";

import { useState } from "react";
import Papa from "papaparse";
import "./globals.css";

function sourceName(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}

function removeFooterRows(rows) {
  const footerIndex = rows.findIndex((row) => {
    return Object.values(row).some((value) => {
      const text = String(value ?? "").toLowerCase();
      return text.includes("total qty") || text.includes("total weight");
    });
  });
  return footerIndex >= 0 ? rows.slice(0, footerIndex) : rows;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function parseQty(value) {
  const number = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(number) ? number : null;
}

function downloadCSV(rows) {
  const csv = Papa.unparse(rows, {
    columns: ["BLItemNo", "ColorName", "Qty", "Source"]
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "highest_qty_by_item_color.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [output, setOutput] = useState([]);
  const [error, setError] = useState("");
  const [processed, setProcessed] = useState(false);

  async function processFiles() {
    setError("");
    setOutput([]);
    setProcessed(false);

    if (!files.length) {
      setError("Please upload at least one CSV file.");
      return;
    }

    const allRows = [];

    try {
      for (const file of files) {
        const text = await file.text();
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: false
        });

        if (parsed.errors.length) {
          throw new Error(`${file.name}: ${parsed.errors[0].message}`);
        }

        const headers = parsed.meta.fields || [];
        const required = ["BLItemNo", "ColorName", "Qty"];
        const missing = required.filter((col) => !headers.includes(col));

        if (missing.length) {
          throw new Error(`${file.name} is missing column(s): ${missing.join(", ")}`);
        }

        const rowsBeforeFooter = removeFooterRows(parsed.data);
        const src = sourceName(file.name);

        for (const row of rowsBeforeFooter) {
          const blItemNo = cleanText(row.BLItemNo);
          const colorName = cleanText(row.ColorName);
          const qty = parseQty(row.Qty);

          if (!blItemNo || !colorName || qty === null) continue;
          if (blItemNo.toLowerCase() === "nan" || colorName.toLowerCase() === "nan") continue;
          if (/total qty|total weight/i.test(blItemNo) || /total qty|total weight/i.test(colorName)) continue;

          allRows.push({
            BLItemNo: blItemNo,
            ColorName: colorName,
            Qty: qty,
            Source: src
          });
        }
      }

      const grouped = new Map();

      for (const row of allRows) {
        const key = `${row.BLItemNo}|||${row.ColorName}`;

        if (!grouped.has(key)) {
          grouped.set(key, {
            BLItemNo: row.BLItemNo,
            ColorName: row.ColorName,
            Qty: row.Qty,
            SourceSet: new Set([row.Source])
          });
        } else {
          const existing = grouped.get(key);
          existing.Qty = Math.max(existing.Qty, row.Qty);
          existing.SourceSet.add(row.Source);
        }
      }

      const result = Array.from(grouped.values())
        .map((row) => ({
          BLItemNo: row.BLItemNo,
          ColorName: row.ColorName,
          Qty: row.Qty,
          Source: Array.from(row.SourceSet).sort().join("; ")
        }))
        .sort((a, b) => {
          const itemCompare = a.BLItemNo.localeCompare(b.BLItemNo, undefined, { numeric: true });
          if (itemCompare !== 0) return itemCompare;
          return a.ColorName.localeCompare(b.ColorName);
        });

      setOutput(result);
      setProcessed(true);
    } catch (err) {
      setError(err.message || "Something went wrong while processing the files.");
    }
  }

  return (
    <main className="main">
      <section className="card">
        <h1>CSV Qty Consolidator</h1>
        <p className="subtitle">
          Upload any number of CSV files. This tool extracts BLItemNo, ColorName and Qty,
          removes Total Qty / Total Weight footer rows and anything after them, then finds
          the highest Qty for every BLItemNo + ColorName combination.
        </p>

        <div className="uploadBox">
          <strong>Upload CSV files</strong>
          <br />
          <input
            type="file"
            accept=".csv"
            multiple
            onChange={(event) => {
              setFiles(Array.from(event.target.files || []));
              setOutput([]);
              setProcessed(false);
              setError("");
            }}
          />
          <p className="small">
            Selected files: {files.length ? files.map((file) => file.name).join(", ") : "None"}
          </p>
        </div>

        <div className="actions">
          <button onClick={processFiles} disabled={!files.length}>
            Process files
          </button>

          <button onClick={() => downloadCSV(output)} disabled={!output.length}>
            Download CSV
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {processed && (
          <div className="success">
            Processed {files.length} file(s). Generated {output.length} unique BLItemNo + ColorName rows.
          </div>
        )}

        {output.length > 0 && (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>BLItemNo</th>
                  <th>ColorName</th>
                  <th>Qty</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {output.slice(0, 200).map((row, index) => (
                  <tr key={`${row.BLItemNo}-${row.ColorName}-${index}`}>
                    <td>{row.BLItemNo}</td>
                    <td>{row.ColorName}</td>
                    <td>{row.Qty}</td>
                    <td>{row.Source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {output.length > 200 && (
          <p className="small">
            Showing first 200 rows only. Download the CSV to get all rows.
          </p>
        )}
      </section>
    </main>
  );
}
