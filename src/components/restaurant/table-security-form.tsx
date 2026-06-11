"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { isEnhancedSecurity } from "@/lib/table-mode";

/**
 * Owner settings for table security mode: enhanced security or advanced options.
 */
export function TableSecurityForm({
  initialRequireConfirmation,
  initialEnableTableSessions,
}: {
  initialRequireConfirmation: boolean;
  initialEnableTableSessions: boolean;
}) {
  const [requireConfirmation, setRequireConfirmation] = useState(initialRequireConfirmation);
  const [enableTableSessions, setEnableTableSessions] = useState(initialEnableTableSessions);
  const [saved, setSaved] = useState(false);
  const { run, pending, error } = useApiAction();

  const enhancedSecurity = isEnhancedSecurity(requireConfirmation, enableTableSessions);

  async function save(next: {
    require_order_confirmation: boolean;
    enable_table_sessions: boolean;
  }) {
    setSaved(false);
    const ok = await run("/api/restaurant/settings/table-security", next);
    if (ok) {
      setRequireConfirmation(next.require_order_confirmation);
      setEnableTableSessions(next.enable_table_sessions);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function setEnhancedSecurity(enabled: boolean) {
    if (enabled) {
      await save({ require_order_confirmation: true, enable_table_sessions: true });
    } else {
      await save({
        require_order_confirmation: false,
        enable_table_sessions: enableTableSessions,
      });
    }
  }

  async function toggleConfirmation(next: boolean) {
    if (next && !enableTableSessions) {
      await save({ require_order_confirmation: true, enable_table_sessions: true });
      return;
    }
    await save({
      require_order_confirmation: next,
      enable_table_sessions: enableTableSessions,
    });
  }

  async function toggleSessions(next: boolean) {
    if (!next) {
      await save({ require_order_confirmation: false, enable_table_sessions: false });
      return;
    }
    await save({
      require_order_confirmation: requireConfirmation,
      enable_table_sessions: true,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Segurança reforçada</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Recomendado para restaurantes com atendimento à mesa.
          </p>
        </div>
        <Button
          variant={enhancedSecurity ? "outline" : "primary"}
          disabled={pending}
          onClick={() => void setEnhancedSecurity(!enhancedSecurity)}
        >
          {pending ? "A guardar…" : enhancedSecurity ? "Desativar" : "Ativar"}
        </Button>
      </div>

      {enhancedSecurity ? (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-900">
          <p className="font-semibold">Segurança reforçada ativa</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Confirmar primeiro pedido antes de enviar para a cozinha: ativo</li>
            <li>Sessões de mesa para conta e fecho da mesa: ativo</li>
          </ul>
          <p>
            Quando ativo, o primeiro pedido de cada telemóvel precisa de confirmação do staff
            antes de ir para a cozinha. O sistema mantém uma sessão de mesa aberta para
            agrupar pedidos, calcular a conta e fechar a mesa quando os clientes saem.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Opções avançadas
          </p>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Confirmar primeiro pedido antes de enviar para a cozinha
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Mais seguro contra pedidos feitos por pessoas que guardaram o QR.
                {requireConfirmation && !enableTableSessions
                  ? " Ativa automaticamente as sessões de mesa."
                  : null}
              </p>
            </div>
            <Button
              size="sm"
              variant={requireConfirmation ? "outline" : "primary"}
              disabled={pending}
              onClick={() => void toggleConfirmation(!requireConfirmation)}
            >
              {requireConfirmation ? "Desativar" : "Ativar"}
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Usar sessões de mesa para conta e fecho da mesa
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Agrupa pedidos da mesma mesa numa sessão, permite ver a conta e fechar a mesa.
              </p>
            </div>
            <Button
              size="sm"
              variant={enableTableSessions ? "outline" : "primary"}
              disabled={pending}
              onClick={() => void toggleSessions(!enableTableSessions)}
            >
              {enableTableSessions ? "Desativar" : "Ativar"}
            </Button>
          </div>

          {!enableTableSessions ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              Atenção: sem sessões de mesa, a receção não terá uma conta agrupada por mesa. Os
              pedidos serão tratados individualmente.
            </p>
          ) : !requireConfirmation ? (
            <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
              Modo rápido com sessões: os pedidos entram diretamente na cozinha, mas continuam
              agrupados numa sessão para conta e fecho da mesa.
            </p>
          ) : null}
        </div>
      )}

      {saved ? <p className="text-xs font-medium text-emerald-600">Guardado.</p> : null}
      <FieldError message={error} />
    </div>
  );
}
