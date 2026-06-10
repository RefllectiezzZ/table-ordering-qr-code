import { TranslationsManager } from "@/components/restaurant/translations-manager";
import { requireRestaurantOwner } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export const metadata = { title: "Translations" };

export default async function TranslationsPage() {
  await requireRestaurantOwner();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Translations (CSV)</h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Export your menu as CSV, translate the name/description/category columns offline (or
          with AI assistance), then import the file back. Every import shows a preview first —
          nothing is changed until you confirm. IDs, prices and allergen codes are never updated
          through this workflow.
        </p>
      </div>
      <TranslationsManager />
    </div>
  );
}
