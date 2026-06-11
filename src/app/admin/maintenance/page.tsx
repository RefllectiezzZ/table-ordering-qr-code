import { OrderRetentionCleanup } from "@/components/admin/order-retention-cleanup";
import { ADMIN_STRINGS } from "@/lib/i18n/app";
import { getAppLanguage } from "@/lib/i18n/server";
import { requirePlatformAdmin } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export const metadata = { title: "Manutenção" };

export default async function AdminMaintenancePage() {
  await requirePlatformAdmin();
  const t = ADMIN_STRINGS[await getAppLanguage()];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{t.maintenanceTitle}</h1>
        <p className="text-sm text-slate-500">{t.maintenanceSubtitle}</p>
      </div>

      <div className="max-w-2xl space-y-4">
        <OrderRetentionCleanup
          labels={{
            title: t.retentionCleanupTitle,
            description: t.retentionCleanupDescription,
            retentionLabel: t.retentionDaysLabel,
            previewButton: t.retentionPreviewButton,
            executeButton: t.retentionExecuteButton,
            confirmLabel: t.retentionConfirmLabel,
            previewing: t.retentionPreviewing,
            executing: t.retentionExecuting,
            orders: t.retentionOrders,
            orderItems: t.retentionOrderItems,
            emptySessions: t.retentionEmptySessions,
            cutoff: t.retentionCutoff,
            success: t.retentionSuccess,
            nonTerminalNote: t.retentionNonTerminalNote,
          }}
        />

        <p className="text-xs leading-relaxed text-slate-400">{t.retentionCronNote}</p>
      </div>
    </div>
  );
}
