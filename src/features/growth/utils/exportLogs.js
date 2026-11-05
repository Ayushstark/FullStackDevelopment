/**
 * Utility functions for exporting practice logs into CSV and JSON formats.
 * Pure JavaScript with zero external dependencies using Blob and object URLs.
 */

/**
 * Escapes a cell value for CSV format.
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates CSV string from an array of practice logs.
 * @param {Array<Object>} logs
 * @returns {string}
 */
export function formatLogsToCsv(logs = []) {
  const headers = ["Date", "Platform", "Problems Solved", "Difficulty", "Category", "Notes"];
  const rows = logs.map((log) => [
    escapeCsvCell(log.date || ""),
    escapeCsvCell(log.platform || ""),
    escapeCsvCell(log.problemsSolved ?? 0),
    escapeCsvCell(log.difficulty || ""),
    escapeCsvCell(log.category || ""),
    escapeCsvCell(log.notes || ""),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

/**
 * Triggers a browser download of a generated file.
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 */
export function triggerFileDownload(content, filename, mimeType = "text/plain") {
  if (typeof window === "undefined" || !window.Blob) return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports logs as a CSV file download.
 * @param {Array<Object>} logs
 * @param {string} [filename]
 */
export function exportLogsAsCsv(logs = [], filename = "practice_history.csv") {
  const csvContent = formatLogsToCsv(logs);
  triggerFileDownload(csvContent, filename, "text/csv;charset=utf-8;");
}

/**
 * Exports logs as a formatted JSON file download.
 * @param {Array<Object>} logs
 * @param {string} [filename]
 */
export function exportLogsAsJson(logs = [], filename = "practice_history.json") {
  const jsonContent = JSON.stringify(logs, null, 2);
  triggerFileDownload(jsonContent, filename, "application/json;charset=utf-8;");
}
