"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";

/**
 * Owner toggle for mandatory first-order confirmation before kitchen.
 */
export function OrderConfirmationForm({
  initialRequireConfirmation,
}: {
  initialRequireConfirmation: boolean;
}) {
  const [requireConfirmation, setRequireConfirmation] = useState(initialRequireConfirmation);
  const [saved, setSaved] = useState(false);
  const { run, pending, error } = useApiAction();

  async function save(next: boolean) {
    setSaved(false);
    const ok = await run("/api/restaurant/settings/order-confirmation", {
      require_order_confirmation: next,
    });
    if (ok) {
      setRequireConfirmation(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Confirmar primeiro pedido antes de enviar para a cozinha
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            <strong>Modo manual (ativo):</strong> o primeiro pedido de cada telemóvel fica a aguardar
            confirmação da equipa; as sessões de mesa são geridas manualmente em Mesas.
            <br />
            <strong>Modo automático (desativo):</strong> os pedidos entram diretamente na cozinha e
            as sessões de mesa são geridas automaticamente.
          </p>
        </div>
        <Button
          variant={requireConfirmation ? "outline" : "primary"}
          disabled={pending}
          onClick={() => void save(!requireConfirmation)}
        >
          {pending ? "A guardar…" : requireConfirmation ? "Desativar" : "Ativar"}
        </Button>
      </div>

      <p
        className={`rounded-lg border p-3 text-xs leading-relaxed ${
          requireConfirmation
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        {requireConfirmation
          ? "Modo manual: mais protegido contra pedidos feitos por pessoas que guardaram o QR. A equipa confirma o primeiro pedido e gere sessões em Mesas."
          : "Modo automático: os pedidos entram diretamente na cozinha e as sessões de mesa são geridas automaticamente. Menos protegido contra abuso de QR guardado."}
      </p>

      {saved ? <p className="text-xs font-medium text-emerald-600">Guardado.</p> : null}
      <FieldError message={error} />
    </div>
  );
}
