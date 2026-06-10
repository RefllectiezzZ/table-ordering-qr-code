"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { ALLERGEN_CODES, getAllergenName } from "@/lib/allergens";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { centsToEuroString, formatCentsToEuro, parseEuroToCents } from "@/lib/money";
import { LANGUAGES, type Language } from "@/types/database";

export interface ProductData {
  id: string;
  categoryId: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  allergenCodes: string[];
  dietaryTags: string[];
  translations: Partial<Record<Language, { name: string; description: string }>>;
}

export interface ProductCategoryOption {
  id: string;
  name: string;
}

interface FormState {
  categoryId: string;
  price: string;
  imageUrl: string;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: string;
  allergenCodes: string[];
  dietaryTags: string;
  translations: Record<Language, { name: string; description: string }>;
}

function toFormState(product?: ProductData): FormState {
  return {
    categoryId: product?.categoryId ?? "",
    price: product ? centsToEuroString(product.priceCents) : "",
    imageUrl: product?.imageUrl ?? "",
    isAvailable: product?.isAvailable ?? true,
    isActive: product?.isActive ?? true,
    sortOrder: String(product?.sortOrder ?? 0),
    allergenCodes: product?.allergenCodes ?? [],
    dietaryTags: (product?.dietaryTags ?? []).join(", "),
    translations: {
      pt: { name: product?.translations.pt?.name ?? "", description: product?.translations.pt?.description ?? "" },
      en: { name: product?.translations.en?.name ?? "", description: product?.translations.en?.description ?? "" },
      es: { name: product?.translations.es?.name ?? "", description: product?.translations.es?.description ?? "" },
      fr: { name: product?.translations.fr?.name ?? "", description: product?.translations.fr?.description ?? "" },
    },
  };
}

function buildPayload(form: FormState, priceCents: number) {
  const translations: Partial<Record<Language, { name: string; description: string }>> = {};
  for (const lang of LANGUAGES) {
    const t = form.translations[lang];
    if (t.name.trim()) {
      translations[lang] = { name: t.name.trim(), description: t.description.trim() };
    }
  }
  return {
    category_id: form.categoryId || null,
    price_cents: priceCents,
    image_url: form.imageUrl.trim(),
    is_available: form.isAvailable,
    is_active: form.isActive,
    sort_order: Number(form.sortOrder) || 0,
    allergen_codes: form.allergenCodes,
    dietary_tags: form.dietaryTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 10),
    translations,
  };
}

function ProductForm({
  initial,
  categories,
  pending,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: FormState;
  categories: ProductCategoryOption[];
  pending: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (form: FormState, priceCents: number) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [priceError, setPriceError] = useState<string | null>(null);
  const hasName = LANGUAGES.some((lang) => form.translations[lang].name.trim());

  function toggleAllergen(code: string) {
    setForm((f) => ({
      ...f,
      allergenCodes: f.allergenCodes.includes(code)
        ? f.allergenCodes.filter((c) => c !== code)
        : [...f.allergenCodes, code],
    }));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const cents = parseEuroToCents(form.price);
        if (cents === null) {
          setPriceError("Enter a valid price, e.g. 3.50 or 3,50");
          return;
        }
        setPriceError(null);
        onSubmit(form, cents);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="price">Price (EUR)</Label>
          <Input
            id="price"
            inputMode="decimal"
            placeholder="3,50"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
          <FieldError message={priceError} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">(no category)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sort">Sort order</Label>
          <Input
            id="sort"
            type="number"
            min={0}
            max={10000}
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="image">Image URL (optional)</Label>
        <Input
          id="image"
          type="url"
          placeholder="https://…"
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
        />
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300"
          />
          Available (can be ordered right now)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300"
          />
          Active (shown on the public menu)
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-slate-600">Allergens (EU codes)</legend>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
          {ALLERGEN_CODES.map((code) => (
            <label key={code} className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={form.allergenCodes.includes(code)}
                onChange={() => toggleAllergen(code)}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              {getAllergenName(code, "pt")}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="tags">Dietary tags (comma-separated, e.g. vegan, vegetarian)</Label>
        <Input
          id="tags"
          value={form.dietaryTags}
          onChange={(e) => setForm((f) => ({ ...f, dietaryTags: e.target.value }))}
        />
      </div>

      <div className="space-y-3">
        {LANGUAGES.map((lang) => (
          <div key={lang} className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-600">{LANGUAGE_LABELS[lang]}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor={`pname-${lang}`}>Name</Label>
                <Input
                  id={`pname-${lang}`}
                  maxLength={120}
                  value={form.translations[lang].name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      translations: {
                        ...f.translations,
                        [lang]: { ...f.translations[lang], name: e.target.value },
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor={`pdesc-${lang}`}>Description</Label>
                <Textarea
                  id={`pdesc-${lang}`}
                  maxLength={600}
                  className="min-h-10"
                  value={form.translations[lang].description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      translations: {
                        ...f.translations,
                        [lang]: { ...f.translations[lang], description: e.target.value },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        ))}
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

export function ProductsManager({
  products,
  categories,
}: {
  products: ProductData[];
  categories: ProductCategoryOption[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { run, pending, error, setError } = useApiAction();

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  async function handleCreate(form: FormState, priceCents: number) {
    const ok = await run("/api/restaurant/products/create", buildPayload(form, priceCents));
    if (ok) setShowCreate(false);
  }

  async function handleUpdate(id: string, form: FormState, priceCents: number) {
    const ok = await run(`/api/restaurant/products/${id}/update`, buildPayload(form, priceCents));
    if (ok) setEditingId(null);
  }

  return (
    <div className="max-w-4xl space-y-4">
      {products.length === 0 && !showCreate ? (
        <EmptyState
          title="No products yet"
          description="Add your first product with a price, allergens and translations."
          action={<Button onClick={() => setShowCreate(true)}>Create product</Button>}
        />
      ) : null}

      {products.map((product) => {
        const displayName =
          product.translations.pt?.name ??
          Object.values(product.translations)[0]?.name ??
          "(no name)";
        return (
          <Card key={product.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{displayName}</CardTitle>
                <span className="text-sm font-semibold text-slate-700">
                  {formatCentsToEuro(product.priceCents)}
                </span>
                {product.categoryId ? (
                  <Badge tone="blue">{categoryNameById.get(product.categoryId) ?? "?"}</Badge>
                ) : null}
                <Badge tone={product.isActive ? "green" : "neutral"}>
                  {product.isActive ? "active" : "inactive"}
                </Badge>
                {!product.isAvailable ? <Badge tone="yellow">unavailable</Badge> : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setEditingId(editingId === product.id ? null : product.id);
                }}
              >
                {editingId === product.id ? "Close" : "Edit"}
              </Button>
            </CardHeader>
            {editingId === product.id ? (
              <CardContent>
                <ProductForm
                  initial={toFormState(product)}
                  categories={categories}
                  pending={pending}
                  error={error}
                  submitLabel="Save changes"
                  onSubmit={(form, cents) => handleUpdate(product.id, form, cents)}
                  onCancel={() => setEditingId(null)}
                />
              </CardContent>
            ) : product.allergenCodes.length > 0 ? (
              <CardContent className="text-xs text-slate-500">
                Allergens: {product.allergenCodes.map((c) => getAllergenName(c, "pt")).join(", ")}
              </CardContent>
            ) : null}
          </Card>
        );
      })}

      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>New product</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              initial={toFormState()}
              categories={categories}
              pending={pending}
              error={error}
              submitLabel="Create product"
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
            />
          </CardContent>
        </Card>
      ) : products.length > 0 ? (
        <Button onClick={() => setShowCreate(true)}>Add product</Button>
      ) : null}
    </div>
  );
}
