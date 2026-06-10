/** Serializes rows to RFC 4180 CSV. Fields are quoted only when needed. */

function serializeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeCsv(rows: string[][]): string {
  return rows.map((row) => row.map(serializeField).join(",")).join("\r\n") + "\r\n";
}
