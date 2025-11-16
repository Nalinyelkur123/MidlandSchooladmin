// Utility functions for data export

/**
 * Convert data to CSV format
 */
export function convertToCSV(data, headers) {
  if (!data || data.length === 0) return '';
  
  // Create header row
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.key] || '';
      // Escape quotes and wrap in quotes
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to CSV
 */
export function exportToCSV(data, headers, filename = 'export.csv') {
  const csv = convertToCSV(data, headers);
  downloadCSV(csv, filename);
}

/**
 * Export to Excel (CSV format, can be opened in Excel)
 */
export function exportToExcel(data, headers, filename = 'export.xlsx') {
  // For now, we'll use CSV format which Excel can open
  // In the future, can use a library like xlsx for true Excel format
  const csv = convertToCSV(data, headers);
  const excelFilename = filename.endsWith('.xlsx') ? filename : filename.replace('.csv', '.xlsx');
  downloadCSV(csv, excelFilename);
}

