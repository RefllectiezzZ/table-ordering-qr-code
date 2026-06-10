"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Label, Textarea } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";

/**
 * Owner toggle for accepting public orders, with an optional message shown on
 * the QR menu while paused. The menu itself stays visible to customers.
 */
export function OrdersAvailabilityForm({
  initialAcceptsOrders,
  initialPausedMessage,
}: {
  initialAcceptsOrders: boolean;
  initialPausedMessage: string | null;
}) {
  const [acceptsOrders, setAcceptsOrders] = useState(initialAcceptsOrders);
  const [pausedMessage, setPausedMessage] = useState(initialPausedMessage ?? "");
  const [saved, setSaved] = useState(false);
  const { run, pending, error } = useApiAction();

  async function save(nextAccepts: boolean) {
    setSaved(false);
    const ok = await run("/api/restaurant/settings/orders", {
      accepts_orders: nextAccepts,
      paused_message: pausedMessage.trim(),
    });
    if (ok) {
      setAcceptsOrders(nextAccepts);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {acceptsOrders ? "A aceitar pedidos" : "Pedidos em pausa"}
          </p>
          <p className="text-xs text-slate-500">
            {acceptsOrders
              ? "Os clientes podem enviar pedidos a partir dos QR codes."
              : "O menu continua visível, mas o envio de pedidos está bloqueado."}
          </p>
        </div>
        <Button
          variant={acceptsOrders ? "outline" : "primary"}
          disabled={pending}
          onClick={() => void save(!acceptsOrders)}
        >
          {pending ? "A guardar…" : acceptsOrders ? "Pausar pedidos" : "Retomar pedidos"}
        </Button>
      </div>

      <div>
        <Label htmlFor="paused-message">Mensagem durante a pausa (opcional)</Label>
        <Textarea
          id="paused-message"
          maxLength={300}
          className="min-h-16"
          placeholder="O restaurante não está a aceitar pedidos neste momento."
          value={pausedMessage}
          onChange={(e) => setPausedMessage(e.target.value)}
        />
        <div className="mt-2 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void save(acceptsOrders)}
          >
            Guardar mensagem
          </Button>
          {saved ? <span className="text-xs text-emerald-600">Guardado.</span> : null}
        </div>
      </div>

      <FieldError message={error} />
    </div>
  );
}
