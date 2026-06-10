"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import type { TableStatus } from "@/types/database";

export interface TableData {
  id: string;
  tableNumber: string;
  label: string | null;
  status: TableStatus;
  url: string;
  qrDataUrl: string;
}

export function TablesManager({ tables }: { tables: TableData[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [label, setLabel] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { run, pending, error } = useApiAction();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run("/api/restaurant/tables/create", {
      table_number: tableNumber.trim(),
      label: label.trim(),
    });
    if (ok) {
      setTableNumber("");
      setLabel("");
      setShowCreate(false);
    }
  }

  async function toggleStatus(table: TableData) {
    await run(`/api/restaurant/tables/${table.id}/update`, {
      status: table.status === "active" ? "inactive" : "active",
    });
  }

  async function copyUrl(table: TableData) {
    try {
      await navigator.clipboard.writeText(table.url);
      setCopiedId(table.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard unavailable (e.g. http on LAN) — the URL is selectable.
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      {tables.length === 0 && !showCreate ? (
        <EmptyState
          title="No tables yet"
          description="Create a table to generate its QR code."
          action={<Button onClick={() => setShowCreate(true)}>Create table</Button>}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {tables.map((table) => (
          <Card key={table.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>{table.label ?? `Mesa ${table.tableNumber}`}</CardTitle>
                <Badge tone={table.status === "active" ? "green" : "neutral"}>
                  {table.status}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggleStatus(table)}>
                {table.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={table.qrDataUrl}
                alt={`QR code for ${table.label ?? `table ${table.tableNumber}`}`}
                className="h-40 w-40 rounded-lg border border-slate-100"
              />
              <p className="w-full select-all break-all rounded-lg bg-slate-50 p-2 text-center text-[11px] text-slate-500">
                {table.url}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyUrl(table)}>
                  {copiedId === table.id ? "Copied!" : "Copy link"}
                </Button>
                <a href={table.url} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm">
                    Open menu
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>New table</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <div className="w-32">
                <Label htmlFor="table-number">Table number</Label>
                <Input
                  id="table-number"
                  required
                  maxLength={20}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="7"
                />
              </div>
              <div className="w-48">
                <Label htmlFor="table-label">Label (optional)</Label>
                <Input
                  id="table-label"
                  maxLength={60}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Mesa 7 — esplanada"
                />
              </div>
              <Button type="submit" disabled={pending || !tableNumber.trim()}>
                {pending ? "Creating…" : "Create table"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <div className="w-full">
                <FieldError message={error} />
              </div>
            </form>
          </CardContent>
        </Card>
      ) : tables.length > 0 ? (
        <Button onClick={() => setShowCreate(true)}>Add table</Button>
      ) : null}
    </div>
  );
}
