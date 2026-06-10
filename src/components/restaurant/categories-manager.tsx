"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label } from "@/components/ui/form";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { LANGUAGES, type Language } from "@/types/database";

export interface CategoryData {
  id: string;
  sortOrder: number;
  isActive: boolean;
  names: Partial<Record<Language, string>>;
}

interface FormState {
  names: Record<Language, string>;
  sortOrder: string;
  isActive: boolean;
}

function toFormState(category?: CategoryData): FormState {
  return {
    names: {
      pt: category?.names.pt ?? "",
      en: category?.names.en ?? "",
      es: category?.names.es ?? "",
      fr: category?.names.fr ?? "",
    },
    sortOrder: String(category?.sortOrder ?? 0),
    isActive: category?.isActive ?? true,
  };
}

function buildPayload(form: FormState) {
  const translations: Partial<Record<Language, string>> = {};
  for (const lang of LANGUAGES) {
    const value = form.names[lang].trim();
    if (value) translations[lang] = value;
  }
  return {
    sort_order: Number(form.sortOrder) || 0,
    is_active: form.isActive,
    translations,
  };
}

function CategoryForm({
  initial,
  pending,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: FormState;
  pending: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (form: FormState) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const hasName = LANGUAGES.some((lang) => form.names[lang].trim());

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {LANGUAGES.map((lang) => (
          <div key={lang}>
            <Label htmlFor={`name-${lang}`}>Name ({LANGUAGE_LABELS[lang]})</Label>
            <Input
              id={`name-${lang}`}
              value={form.names[lang]}
              maxLength={120}
              onChange={(e) =>
                setForm((f) => ({ ...f, names: { ...f.names, [lang]: e.target.value } }))
              }
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-28">
          <Label htmlFor="sort-order">Sort order</Label>
          <Input
            id="sort-order"
            type="number"
            min={0}
            max={10000}
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300"
          />
          Active (visible on the public menu)
        </label>
      </div>
      <FieldError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !hasName}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function CategoriesManager({ categories }: { categories: CategoryData[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { run, pending, error, setError } = useApiAction();

  async function handleCreate(form: FormState) {
    const ok = await run("/api/restaurant/categories/create", buildPayload(form));
    if (ok) setShowCreate(false);
  }

  async function handleUpdate(id: string, form: FormState) {
    const ok = await run(`/api/restaurant/categories/${id}/update`, buildPayload(form));
    if (ok) setEditingId(null);
  }

  return (
    <div className="max-w-3xl space-y-4">
      {categories.length === 0 && !showCreate ? (
        <EmptyState
          title="No categories yet"
          description="Create your first category (e.g. Starters, Drinks, Desserts) to organise the menu."
          action={<Button onClick={() => setShowCreate(true)}>Create category</Button>}
        />
      ) : null}

      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>{category.names.pt ?? Object.values(category.names)[0] ?? "—"}</CardTitle>
              <Badge tone={category.isActive ? "green" : "neutral"}>
                {category.isActive ? "active" : "inactive"}
              </Badge>
              <span className="text-xs text-slate-400">order {category.sortOrder}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setEditingId(editingId === category.id ? null : category.id);
              }}
            >
              {editingId === category.id ? "Close" : "Edit"}
            </Button>
          </CardHeader>
          {editingId === category.id ? (
            <CardContent>
              <CategoryForm
                initial={toFormState(category)}
                pending={pending}
                error={error}
                submitLabel="Save changes"
                onSubmit={(form) => handleUpdate(category.id, form)}
                onCancel={() => setEditingId(null)}
              />
            </CardContent>
          ) : (
            <CardContent className="text-xs text-slate-500">
              {LANGUAGES.map((lang) => (
                <span key={lang} className="mr-4">
                  <strong className="uppercase">{lang}:</strong> {category.names[lang] ?? "—"}
                </span>
              ))}
            </CardContent>
          )}
        </Card>
      ))}

      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>New category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm
              initial={toFormState()}
              pending={pending}
              error={error}
              submitLabel="Create category"
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
            />
          </CardContent>
        </Card>
      ) : categories.length > 0 ? (
        <Button onClick={() => setShowCreate(true)}>Add category</Button>
      ) : null}
    </div>
  );
}
