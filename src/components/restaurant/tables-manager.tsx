"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { formatDateTime, relativeTimePt } from "@/lib/utils";
import type { TableStatus } from "@/types/database";

export interface TableData {
  id: string;
  tableNumber: string;
  label: string | null;
  status: TableStatus;
  url: string;
  qrDataUrl: string;
  openSessionId: string | null;
  sessionOpenedAt: string | null;
  openOrderCount: number;
  pendingCount: number;
  sessionOrderCount: number;
  latestOrderAt: string | null;
}

function tableStateBadges(table: TableData) {
  const badges: { label: string; tone: "green" | "yellow" | "red" | "neutral" | "blue" | "purple" }[] = [];
  if (table.status !== "active") {
    badges.push({ label: "QR inativo", tone: "neutral" });
  }
  if (table.pendingCount > 0) {
    badges.push({ label: `${table.pendingCount} por confirmar`, tone: "purple" });
  }
  if (table.openOrderCount > 0) {
    badges.push({ label: `${table.openOrderCount} em curso`, tone: "red" });
  }
  if (table.openSessionId) {
    badges.push({ label: "Ocupada", tone: "yellow" });
  } else {
    badges.push({ label: "Livre", tone: "green" });
  }
  return badges;
}

function FloorCard({
  table,
  isOwner,
  busy,
  onOpenSession,
  onCloseSession,
  onToggleStatus,
}: {
  table: TableData;
  isOwner: boolean;
  busy: boolean;
  onOpenSession: (table: TableData) => void;
  onCloseSession: (table: TableData) => void;
  onToggleStatus: (table: TableData) => void;
}) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(table.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. http on LAN) — the URL is selectable.
    }
  }

  return (
    <Card className={table.pendingCount > 0 ? "border-violet-300" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base">
            {table.label ?? `Mesa ${table.tableNumber}`}
          </CardTitle>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tableStateBadges(table).map((badge) => (
              <Badge key={badge.label} tone={badge.tone}>
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500">
          <dt>Sessão aberta</dt>
          <dd className="text-right font-medium text-slate-700">
            {table.sessionOpenedAt ? formatDateTime(table.sessionOpenedAt) : "—"}
          </dd>
          <dt>Pedidos na sessão</dt>
          <dd className="text-right font-medium text-slate-700">
            {table.openSessionId ? table.sessionOrderCount : "—"}
          </dd>
          <dt>Último pedido</dt>
          <dd className="text-right font-medium text-slate-700">
            {table.latestOrderAt ? relativeTimePt(table.latestOrderAt) : "—"}
          </dd>
        </dl>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {table.openSessionId ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onCloseSession(table)}>
              Fechar sessão
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onOpenSession(table)}>
              Abrir sessão
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setShowQr((v) => !v)}>
            {showQr ? "Esconder QR" : "Ver QR"}
          </Button>
          {isOwner ? (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onToggleStatus(table)}>
              {table.status === "active" ? "Desativar QR" : "Ativar QR"}
            </Button>
          ) : null}
        </div>

        {showQr ? (
          <div className="flex flex-col items-center gap-3 border-t border-slate-100 pt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={table.qrDataUrl}
              alt={`QR code da ${table.label ?? `mesa ${table.tableNumber}`}`}
              className="h-40 w-40 rounded-lg border border-slate-100"
            />
            <p className="w-full select-all break-all rounded-lg bg-slate-50 p-2 text-center text-[11px] text-slate-500">
              {table.url}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? "Copiado!" : "Copiar link"}
              </Button>
              <a href={table.url} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm">
                  Abrir menu
                </Button>
              </a>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function TablesManager({ tables, isOwner }: { tables: TableData[]; isOwner: boolean }) {
  const [showCreate, setShowCreate] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [label, setLabel] = useState("");
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

  async function openSession(table: TableData) {
    await run(`/api/restaurant/tables/${table.id}/open-session`, {});
  }

  async function closeSession(table: TableData) {
    if (!table.openSessionId) return;
    if (
      !window.confirm(
        `Fechar a sessão da ${table.label ?? `Mesa ${table.tableNumber}`}? ` +
          "Os pedidos ficam no histórico e os clientes seguintes voltam a precisar de confirmação.",
      )
    ) {
      return;
    }

    const ok = await run(`/api/restaurant/table-sessions/${table.openSessionId}/close`, {
      force: false,
    });
    if (ok) return;

    // The API blocks the close when open orders remain; ask for the explicit
    // override described in the warning.
    if (
      window.confirm(
        "Esta mesa ainda tem pedidos que não estão entregues/cancelados. Fechar mesmo assim?",
      )
    ) {
      await run(`/api/restaurant/table-sessions/${table.openSessionId}/close`, { force: true });
    }
  }

  return (
    <div className="max-w-5xl space-y-4">
      {tables.length === 0 && !showCreate ? (
        <EmptyState
          title="Ainda não há mesas"
          description={
            isOwner
              ? "Crie uma mesa para gerar o QR code respetivo."
              : "O responsável ainda não criou mesas."
          }
          action={
            isOwner ? <Button onClick={() => setShowCreate(true)}>Criar mesa</Button> : undefined
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => (
          <FloorCard
            key={table.id}
            table={table}
            isOwner={isOwner}
            busy={pending}
            onOpenSession={(t) => void openSession(t)}
            onCloseSession={(t) => void closeSession(t)}
            onToggleStatus={(t) => void toggleStatus(t)}
          />
        ))}
      </div>

      {error ? <FieldError message={error} /> : null}

      {isOwner && showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>Nova mesa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <div className="w-32">
                <Label htmlFor="table-number">Número</Label>
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
                <Label htmlFor="table-label">Nome (opcional)</Label>
                <Input
                  id="table-label"
                  maxLength={60}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Mesa 7 (esplanada)"
                />
              </div>
              <Button type="submit" disabled={pending || !tableNumber.trim()}>
                {pending ? "A criar…" : "Criar mesa"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : isOwner && tables.length > 0 ? (
        <Button onClick={() => setShowCreate(true)}>Adicionar mesa</Button>
      ) : null}
    </div>
  );
}
