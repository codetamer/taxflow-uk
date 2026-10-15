/**
 * TaxFlow UK Ingestion Engine - RFC 4180 Compliant Zero-Dependency CSV Parser
 * Handles delimiters (comma, semicolon, tab), quotes, escaped quotes (""), and multiline values.
 */

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  rawRowCount: number;
}

export function detectDelimiter(sample: string): string {
  const firstLines = sample.split(/\r?\n/).slice(0, 5).join('\n');
  const commaCount = (firstLines.match(/,/g) || []).length;
  const semiCount = (firstLines.match(/;/g) || []).length;
  const tabCount = (firstLines.match(/\t/g) || []).length;

  if (semiCount > commaCount && semiCount > tabCount) return ';';
  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  return ',';
}

export function parseCsv(text: string, customDelimiter?: string): ParsedCsv {
  if (!text || text.trim().length === 0) {
    return { headers: [], rows: [], rawRowCount: 0 };
  }

  const delimiter = customDelimiter || detectDelimiter(text);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
        i++;
        continue;
      }
    }

    if (!insideQuotes && char === delimiter) {
      currentRow.push(currentField.trim());
      currentField = '';
      i++;
      continue;
    }

    if (!insideQuotes && (char === '\r' || char === '\n')) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r of \r\n
      }
      currentRow.push(currentField.trim());
      currentField = '';

      // Only push non-empty rows
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  // Push last field & row if non-empty
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], rawRowCount: 0 };
  }

  const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  const dataRows = rows.slice(1);

  return {
    headers,
    rows: dataRows,
    rawRowCount: dataRows.length
  };
}

