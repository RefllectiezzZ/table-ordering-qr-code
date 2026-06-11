"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/form";
import { RETENTION_DAY_OPTIONS } from "@/lib/maintenance/orders-cleanup";

interface CleanupPreview {
  retentionDays: number;
  cutoffIso: string;
  orderCount: number;
  orderItemCount: number;
  emptyClosedSessionCount: number;
}

const CONFIRM_TEXT = "APAGAR PEDIDOS ANTIGOS";

export function OrderRetentionCleanup({
  labels,
}: {
  labels: {
    title: string;
    description: string;
    retentionLabel: string;
    previewButton: string;
    executeButton: string;
    confirmLabel: string;
    previewing: string;
    executing: string;
    orders: string;
    orderItems: string;
    emptySessions: string;
    cutoff: string;
    success: string;
    nonTerminalNote: string;
  };
}) {
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState<"preview" | "execute" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function runPreview() {
    setPending("preview");
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/maintenance/orders-cleanup/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retention_days: retentionDays }),
      });
      const payload = (await response.json()) as {
        preview?: CleanupPreview;
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Preview failed");
        setPreview(null);
        return;
      }
      setPreview(payload.preview ?? null);
      setConfirmText("");
    } catch {
      setError("Preview failed");
      setPreview(null);
    } finally {
      setPending(null);
    }
  }

  async function runExecute() {
    if (confirmText !== CONFIRM_TEXT) return;
    setPending("execute");
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/maintenance/orders-cleanup/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retention_days: retentionDays, confirm_text: confirmText }),
      });
      const payload = (await response.json()) as {
        result?: { deletedOrders: number; deletedOrderItems: number; deletedEmptySessions: number };
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Cleanup failed");
        return;
      }
      const result = payload.result;
      setSuccess(
        result
          ? `${labels.success}: ${result.deletedOrders} ${labels.orders.toLowerCase()}, ${result.deletedOrderItems} ${labels.orderItems.toLowerCase()}.`
          : labels.success,
      );
      setPreview(null);
      setConfirmText("");
    } catch {
      setError("Cleanup failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600">{labels.description}</p>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          {labels.nonTerminalNote}
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="retention-days" className="mb-1 block text-xs font-medium text-slate-600">
              {labels.retentionLabel}
            </label>
            <select
              id="retention-days"
              value={retentionDays}
              onChange={(e) => {
                setRetentionDays(Number(e.target.value));
                setPreview(null);
                setConfirmText("");
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {RETENTION_DAY_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} dias
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            disabled={pending !== null}
            onClick={() => void runPreview()}
          >
            {pending === "preview" ? labels.previewing : labels.previewButton}
          </Button>
        </div>

        {preview ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="text-xs text-slate-500">
              {labels.cutoff}: {new Date(preview.cutoffIso).toLocaleString("pt-PT")}
            </p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">{labels.orders}</dt>
                <dd className="text-lg font-bold text-slate-900">{preview.orderCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{labels.orderItems}</dt>
                <dd className="text-lg font-bold text-slate-900">{preview.orderItemCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{labels.emptySessions}</dt>
                <dd className="text-lg font-bold text-slate-900">
                  {preview.emptyClosedSessionCount}
                </dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              <label htmlFor="confirm-cleanup" className="block text-xs font-medium text-slate-600">
                {labels.confirmLabel} <span className="font-mono text-red-700">{CONFIRM_TEXT}</span>
              </label>
              <input
                id="confirm-cleanup"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
                autoComplete="off"
              />
              <Button
                variant="primary"
                disabled={pending !== null || confirmText !== CONFIRM_TEXT || preview.orderCount === 0}
                onClick={() => void runExecute()}
              >
                {pending === "execute" ? labels.executing : labels.executeButton}
              </Button>
            </div>
          </div>
        ) : null}

        {success ? <p className="text-sm font-medium text-emerald-600">{success}</p> : null}
        <FieldError message={error} />
      </CardContent>
    </Card>
  );
}
