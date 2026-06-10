"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { cn } from "@/lib/utils";

export interface OpeningHoursDayValue {
  weekday: number;
  isClosed: boolean;
  /** "HH:MM" */
  opensAt: string;
  closesAt: string;
  notes: string;
}

/** Monday-first display order; weekday numbers keep the 0=Sunday convention. */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const DAY_LABELS: Record<number, string> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
  0: "Domingo",
};

export function defaultOpeningHoursDay(weekday: number): OpeningHoursDayValue {
  return { weekday, isClosed: false, opensAt: "09:00", closesAt: "22:00", notes: "" };
}

/**
 * Owner-only weekly schedule editor. Saves all 7 days at once; the server
 * derives the restaurant from the session and re-validates every time.
 */
export function OpeningHoursForm({
  initialDays,
  configured,
}: {
  initialDays: OpeningHoursDayValue[];
  configured: boolean;
}) {
  const [days, setDays] = useState<OpeningHoursDayValue[]>(() =>
    DAY_ORDER.map(
      (weekday) =>
        initialDays.find((day) => day.weekday === weekday) ??
        defaultOpeningHoursDay(weekday),
    ),
  );
  const [saved, setSaved] = useState(false);
  const { run, pending, error } = useApiAction();

  function updateDay(weekday: number, patch: Partial<OpeningHoursDayValue>) {
    setSaved(false);
    setDays((current) =>
      current.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)),
    );
  }

  const invalidDays = days.filter(
    (day) =>
      !day.isClosed &&
      (!day.opensAt || !day.closesAt || day.opensAt === day.closesAt),
  );

  async function save() {
    setSaved(false);
    if (invalidDays.length > 0) return;
    const ok = await run("/api/restaurant/opening-hours", {
      days: days.map((day) => ({
        weekday: day.weekday,
        is_closed: day.isClosed,
        opens_at: day.isClosed ? "" : day.opensAt,
        closes_at: day.isClosed ? "" : day.closesAt,
        notes: day.notes.trim(),
      })),
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="space-y-4">
      {!configured ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          Horário não configurado. Enquanto não guardar um horário, os clientes podem enviar
          pedidos a qualquer hora.
        </p>
      ) : null}

      <ul className="divide-y divide-slate-100">
        {days.map((day) => (
          <li key={day.weekday} className="flex flex-wrap items-center gap-3 py-2.5">
            <span className="w-20 shrink-0 text-sm font-semibold text-slate-800">
              {DAY_LABELS[day.weekday]}
            </span>

            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={day.isClosed}
                onChange={(e) => updateDay(day.weekday, { isClosed: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 accent-slate-900"
              />
              Fechado
            </label>

            <div
              className={cn(
                "flex items-center gap-2",
                day.isClosed && "pointer-events-none opacity-40",
              )}
            >
              <Input
                type="time"
                aria-label={`${DAY_LABELS[day.weekday]}: abertura`}
                value={day.opensAt}
                onChange={(e) => updateDay(day.weekday, { opensAt: e.target.value })}
                className="w-28"
                disabled={day.isClosed}
              />
              <span className="text-xs text-slate-400">às</span>
              <Input
                type="time"
                aria-label={`${DAY_LABELS[day.weekday]}: fecho`}
                value={day.closesAt}
                onChange={(e) => updateDay(day.weekday, { closesAt: e.target.value })}
                className="w-28"
                disabled={day.isClosed}
              />
            </div>

            <Input
              type="text"
              aria-label={`${DAY_LABELS[day.weekday]}: nota`}
              placeholder="Nota (opcional)"
              maxLength={200}
              value={day.notes}
              onChange={(e) => updateDay(day.weekday, { notes: e.target.value })}
              className="min-w-36 flex-1"
            />
          </li>
        ))}
      </ul>

      {invalidDays.length > 0 ? (
        <p className="text-xs text-red-600">
          Dias abertos precisam de hora de abertura e de fecho diferentes entre si.
        </p>
      ) : null}
      <FieldError message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void save()} disabled={pending || invalidDays.length > 0}>
          {pending ? "A guardar…" : "Guardar horário"}
        </Button>
        {saved ? <span className="text-xs font-medium text-emerald-600">Horário guardado.</span> : null}
      </div>

      <div className="space-y-1 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
        <p>
          O menu continua visível fora do horário, mas os clientes não conseguem enviar
          pedidos.
        </p>
        <p>
          Se a hora de fecho for anterior à de abertura, o horário atravessa a meia-noite
          (ex.: 18:00 às 02:00). Por agora só é possível um intervalo por dia.
        </p>
      </div>
    </div>
  );
}
