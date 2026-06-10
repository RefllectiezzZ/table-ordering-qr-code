"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/form";

interface PreviewRow {
  rowNumber: number;
  productId: string;
  categoryId: string | null;
  status: "valid" | "invalid" | "warning";
  errors: string[];
  warnings: string[];
  updates: string[];
}

interface PreviewSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  matchedProducts: number;
  matchedCategories: number;
  unknownProductIds: string[];
  unknownCategoryIds: string[];
}

interface PreviewState {
  batchId: string;
  summary: PreviewSummary;
  rows: PreviewRow[];
}

interface CommitResultState {
  productTranslations: number;
  categoryTranslations: number;
  skippedRows: number;
}

export function TranslationsManager() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [committed, setCommitted] = useState<CommitResultState | null>(null);
  const [skipUnknown, setSkipUnknown] = useState(false);
  const [pending, setPending] = useState<"preview" | "commit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setCommitted(null);
    setPreview(null);
    setFileName(file.name);
    setSkipUnknown(false);
    setPending("preview");

    try {
      const content = await file.text();
      const response = await fetch("/api/restaurant/translations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, csv_content: content }),
      });
      const payload = (await response.json()) as {
        batch_id?: string;
        summary?: PreviewSummary;
        rows?: PreviewRow[];
        errors?: string[];
      };
      if (!response.ok || !payload.batch_id || !payload.summary || !payload.rows) {
        setError(payload.errors?.join(" ") ?? "Could not read the CSV file.");
        return;
      }
      setPreview({ batchId: payload.batch_id, summary: payload.summary, rows: payload.rows });
    } catch {
      setError("Could not read the CSV file.");
    } finally {
      setPending(null);
    }
  }

  async function handleCommit() {
    if (!preview) return;
    setError(null);
    setPending("commit");
    try {
      const response = await fetch("/api/restaurant/translations/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: preview.batchId, skip_unknown: skipUnknown }),
      });
      const payload = (await response.json()) as {
        message?: string;
        product_translations_upserted?: number;
        category_translations_upserted?: number;
        skipped_rows?: number;
      };
      if (!response.ok) {
        setError(payload.message ?? "Could not commit the import.");
        return;
      }
      setCommitted({
        productTranslations: payload.product_translations_upserted ?? 0,
        categoryTranslations: payload.category_translations_upserted ?? 0,
        skippedRows: payload.skipped_rows ?? 0,
      });
      setPreview(null);
      router.refresh();
    } catch {
      setError("Could not commit the import.");
    } finally {
      setPending(null);
    }
  }

  const blocked = preview !== null && preview.summary.invalidRows > 0 && !skipUnknown;

  return (
    <div className="max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>1 · Export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <a href="/api/restaurant/translations/export">
            <Button variant="outline">Download translation CSV</Button>
          </a>
          <p className="text-xs text-slate-500">
            Contains one row per product with product_id, category_id, price and allergens (for
            context) plus name/description/category columns for PT, EN, ES and FR.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2 · Import with preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Translated CSV file
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
            />
          </label>
          {pending === "preview" ? (
            <p className="text-sm text-slate-500">Analysing {fileName}…</p>
          ) : null}
          <FieldError message={error} />

          {preview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryStat label="Rows found" value={preview.summary.totalRows} />
                <SummaryStat label="Valid" value={preview.summary.validRows} tone="text-emerald-600" />
                <SummaryStat label="Warnings" value={preview.summary.warningRows} tone="text-amber-600" />
                <SummaryStat label="Invalid" value={preview.summary.invalidRows} tone="text-red-600" />
              </div>
              <p className="text-xs text-slate-500">
                {preview.summary.matchedProducts} product(s) and{" "}
                {preview.summary.matchedCategories} categor(y/ies) matched by ID.
                {preview.summary.unknownProductIds.length > 0 ? (
                  <>
                    {" "}
                    Unknown product IDs:{" "}
                    <span className="font-mono">
                      {preview.summary.unknownProductIds.slice(0, 5).join(", ")}
                      {preview.summary.unknownProductIds.length > 5 ? "…" : ""}
                    </span>
                  </>
                ) : null}
              </p>

              <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Product ID</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Will update</th>
                      <th className="px-3 py-2">Problems</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.rows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="px-3 py-2 text-slate-500">{row.rowNumber}</td>
                        <td className="px-3 py-2 font-mono text-[10px]">{row.productId || "—"}</td>
                        <td className="px-3 py-2">
                          <Badge
                            tone={
                              row.status === "valid"
                                ? "green"
                                : row.status === "warning"
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {row.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.updates.length > 0 ? row.updates.join(", ") : "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {[...row.errors, ...row.warnings].join(" ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.summary.invalidRows > 0 ? (
                <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                  <input
                    type="checkbox"
                    checked={skipUnknown}
                    onChange={(e) => setSkipUnknown(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300"
                  />
                  <span>
                    Skip the {preview.summary.invalidRows} invalid row(s) and import only the
                    valid ones. Leave unchecked to block the commit until the CSV is fixed.
                  </span>
                </label>
              ) : null}

              <div className="flex gap-2">
                <Button onClick={handleCommit} disabled={pending === "commit" || blocked}>
                  {pending === "commit" ? "Committing…" : "Confirm & commit import"}
                </Button>
                <Button variant="ghost" onClick={() => setPreview(null)}>
                  Discard preview
                </Button>
              </div>
            </div>
          ) : null}

          {committed ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Import committed: {committed.productTranslations} product translation(s) and{" "}
              {committed.categoryTranslations} category translation(s) updated
              {committed.skippedRows > 0 ? `, ${committed.skippedRows} row(s) skipped` : ""}.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "text-slate-900",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${tone}`}>{value}</p>
    </div>
  );
}
