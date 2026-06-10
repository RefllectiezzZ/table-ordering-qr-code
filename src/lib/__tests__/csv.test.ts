import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv/parse";
import { serializeCsv } from "@/lib/csv/serialize";

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quoted fields with commas and newlines", () => {
    expect(parseCsv('name,desc\n"Croissant, grande","line1\nline2"')).toEqual([
      ["name", "desc"],
      ["Croissant, grande", "line1\nline2"],
    ]);
  });

  it("handles escaped quotes", () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([["a"], ['say "hi"']]);
  });

  it("strips a UTF-8 BOM", () => {
    expect(parseCsv("\uFEFFa,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("drops trailing empty rows", () => {
    expect(parseCsv("a,b\n1,2\n\n\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("serializeCsv", () => {
  it("quotes only when needed", () => {
    const csv = serializeCsv([
      ["plain", "with,comma", 'with"quote', "with\nnewline"],
    ]);
    expect(csv).toBe('plain,"with,comma","with""quote","with\nnewline"\r\n');
  });

  it("round-trips through parseCsv", () => {
    const rows = [
      ["product_id", "name_pt", "description_pt"],
      ["abc-123", "Croissant, grande", 'Com "Nutella"\ne manteiga'],
      ["def-456", "", "—"],
    ];
    expect(parseCsv(serializeCsv(rows))).toEqual(rows);
  });
});
