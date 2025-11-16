// Utility functions for data import

/**
 * Parse CSV file content
 */
export function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], data: [] };

  // Parse header row
  const headers = lines[0]
    .split(',')
    .map(h => h.trim().replace(/^"|"$/g, ''));

  // Parse data rows
  const data = lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  return { headers, data };
}

/**
 * Read file as text
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Validate imported data
 */
export function validateImportedData(data, requiredFields = [], fieldValidators = {}) {
  const errors = [];
  const validData = [];

  data.forEach((row, index) => {
    const rowErrors = [];
    const rowNumber = index + 2; // +2 because index 0 is header, so first data row is 2

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        rowErrors.push(`Row ${rowNumber}: Missing required field "${field}"`);
      }
    });

    // Run custom validators
    Object.keys(fieldValidators).forEach(field => {
      const validator = fieldValidators[field];
      const value = row[field];
      if (value && validator) {
        const error = validator(value, row);
        if (error) {
          rowErrors.push(`Row ${rowNumber}: ${error}`);
        }
      }
    });

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validData.push(row);
    }
  });

  return { validData, errors };
}

/**
 * Normalize field names (convert various formats to standard format)
 */
export function normalizeFieldNames(data, fieldMapping = {}) {
  return data.map(row => {
    const normalized = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = fieldMapping[key.toLowerCase().trim()] || key;
      normalized[normalizedKey] = row[key];
    });
    return normalized;
  });
}

