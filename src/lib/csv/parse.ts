/**
 * Minimal RFC 4180 CSV parser. Handles quoted fields, escaped quotes (""),
 * embedded commas/newlines, CRLF/LF line endings and a UTF-8 BOM.
 * No dependencies so it is easy to audit and unit test.
 */
export function parseCsv(text: string): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < input.length) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += char;
        i += 1;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
    } else if (char === ",") {
      pushField();
      i += 1;
    } else if (char === "\r") {
      if (input[i + 1] === "\n") i += 1;
      pushRow();
      i += 1;
    } else if (char === "\n") {
      pushRow();
      i += 1;
    } else {
      field += char;
      i += 1;
    }
  }

  // Final field/row (no trailing newline).
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  // Drop fully empty trailing rows (common with trailing newlines/edits).
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0].trim() === "") {
      rows.pop();
    } else {
      break;
    }
  }

  return rows;
}
