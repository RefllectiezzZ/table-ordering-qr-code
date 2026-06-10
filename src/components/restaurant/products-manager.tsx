"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { ALLERGEN_CODES, getAllergenName } from "@/lib/allergens";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { centsToEuroString, formatCentsToEuro, parseEuroToCents } from "@/lib/money";
import type { Language } from "@/types/database";

const OPTIONAL_LANGUAGES: Language[] = ["en", "es", "fr"];
const ALL_LANGUAGES: Language[] = ["pt", ...OPTIONAL_LANGUAGES];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
  for (const lang of ALL_LANGUAGES) {
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

function TranslationFields({
  lang,
  form,
  setForm,
  required,
}: {
  lang: Language;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div>
        <Label htmlFor={`pname-${lang}`}>Nome{required ? " *" : ""}</Label>
        <Input
          id={`pname-${lang}`}
          maxLength={120}
          required={required}
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
        <Label htmlFor={`pdesc-${lang}`}>Descrição</Label>
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
  );
}

function ImageField({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Use uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("A imagem não pode ter mais de 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/restaurant/products/upload-image", {
        method: "POST",
        body,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        setUploadError(payload.error ?? "Não foi possível carregar a imagem.");
        return;
      }
      setForm((f) => ({ ...f, imageUrl: payload.url! }));
    } catch {
      setUploadError("Não foi possível carregar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label>Fotografia do produto</Label>
      <div className="flex flex-wrap items-center gap-3">
        {form.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.imageUrl}
            alt=""
            className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-400">
            sem foto
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "A carregar…" : form.imageUrl ? "Substituir imagem" : "Carregar imagem"}
          </Button>
          {form.imageUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
            >
              Remover
            </Button>
          ) : null}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">JPEG, PNG ou WebP, até 5 MB.</p>
      <FieldError message={uploadError} />
      <button
        type="button"
        onClick={() => setShowUrlField((v) => !v)}
        className="mt-1 text-[11px] text-slate-400 underline hover:text-slate-600"
      >
        {showUrlField ? "Esconder URL externo" : "Ou usar um URL externo"}
      </button>
      {showUrlField ? (
        <Input
          type="url"
          placeholder="https://…"
          className="mt-1"
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
        />
      ) : null}
    </div>
  );
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
  // Portuguese is the base language: only the PT name gates submission.
  const hasBaseName = Boolean(form.translations.pt.name.trim());
  const hasOptionalContent = OPTIONAL_LANGUAGES.some(
    (lang) => form.translations[lang].name.trim() || form.translations[lang].description.trim(),
  );
  const [showOptional, setShowOptional] = useState(hasOptionalContent);

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
          setPriceError("Indique um preço válido, ex.: 3.50 ou 3,50");
          return;
        }
        setPriceError(null);
        onSubmit(form, cents);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="price">Preço (EUR)</Label>
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
          <Label htmlFor="category">Categoria</Label>
          <Select
            id="category"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">(sem categoria)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sort">Ordem</Label>
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

      <ImageField form={form} setForm={setForm} />

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300"
          />
          Disponível (pode ser pedido agora)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300"
          />
          Ativo (visível no menu público)
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-slate-600">
          Alergénios (códigos UE estáveis; os nomes são traduzidos automaticamente no menu)
        </legend>
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
        <Label htmlFor="tags">Etiquetas dietéticas (separadas por vírgula, ex.: vegan)</Label>
        <Input
          id="tags"
          value={form.dietaryTags}
          onChange={(e) => setForm((f) => ({ ...f, dietaryTags: e.target.value }))}
        />
      </div>

      {/* Base language */}
      <div className="rounded-lg border border-slate-300 bg-slate-50/60 p-3">
        <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
          {LANGUAGE_LABELS.pt}
          <Badge tone="blue">Idioma base · obrigatório</Badge>
        </p>
        <TranslationFields lang="pt" form={form} setForm={setForm} required />
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Preencha primeiro em português. Pode adicionar traduções manualmente ou usar a
          exportação/importação CSV multi-idioma.
        </p>
      </div>

      {/* Optional translations */}
      <div className="rounded-lg border border-slate-200 p-3">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-600"
        >
          <span className="flex items-center gap-2">
            Traduções (English · Español · Français)
            <Badge>Tradução opcional</Badge>
          </span>
          <span aria-hidden>{showOptional ? "▾" : "▸"}</span>
        </button>
        {showOptional ? (
          <div className="mt-3 space-y-3">
            {OPTIONAL_LANGUAGES.map((lang) => (
              <div key={lang} className="rounded-lg border border-slate-100 p-3">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  {LANGUAGE_LABELS[lang]}
                  <span className="text-[10px] font-normal text-slate-400">
                    Tradução opcional
                  </span>
                </p>
                <TranslationFields lang={lang} form={form} setForm={setForm} />
              </div>
            ))}
            <p className="text-[11px] leading-relaxed text-slate-400">
              Fluxo recomendado: criar o produto em português, exportar o CSV multi-idioma em
              Traduções, traduzir fora da aplicação, importar com pré-visualização e confirmar.
            </p>
          </div>
        ) : null}
      </div>

      <FieldError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !hasBaseName}>
          {pending ? "A guardar…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
      {!hasBaseName ? (
        <p className="text-[11px] text-slate-400">
          O nome em português é obrigatório para criar o produto.
        </p>
      ) : null}
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
          title="Ainda não há produtos"
          description="Crie o primeiro produto em português, com preço, alergénios e fotografia. As traduções são opcionais."
          action={<Button onClick={() => setShowCreate(true)}>Criar produto</Button>}
        />
      ) : null}

      {products.map((product) => {
        const displayName =
          product.translations.pt?.name ??
          Object.values(product.translations)[0]?.name ??
          "(sem nome)";
        return (
          <Card key={product.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 object-cover"
                  />
                ) : null}
                <CardTitle>{displayName}</CardTitle>
                <span className="text-sm font-semibold text-slate-700">
                  {formatCentsToEuro(product.priceCents)}
                </span>
                {product.categoryId ? (
                  <Badge tone="blue">{categoryNameById.get(product.categoryId) ?? "?"}</Badge>
                ) : null}
                <Badge tone={product.isActive ? "green" : "neutral"}>
                  {product.isActive ? "ativo" : "inativo"}
                </Badge>
                {!product.isAvailable ? <Badge tone="yellow">indisponível</Badge> : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setEditingId(editingId === product.id ? null : product.id);
                }}
              >
                {editingId === product.id ? "Fechar" : "Editar"}
              </Button>
            </CardHeader>
            {editingId === product.id ? (
              <CardContent>
                <ProductForm
                  initial={toFormState(product)}
                  categories={categories}
                  pending={pending}
                  error={error}
                  submitLabel="Guardar alterações"
                  onSubmit={(form, cents) => handleUpdate(product.id, form, cents)}
                  onCancel={() => setEditingId(null)}
                />
              </CardContent>
            ) : product.allergenCodes.length > 0 ? (
              <CardContent className="text-xs text-slate-500">
                Alergénios: {product.allergenCodes.map((c) => getAllergenName(c, "pt")).join(", ")}
              </CardContent>
            ) : null}
          </Card>
        );
      })}

      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>Novo produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              initial={toFormState()}
              categories={categories}
              pending={pending}
              error={error}
              submitLabel="Criar produto"
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
            />
          </CardContent>
        </Card>
      ) : products.length > 0 ? (
        <Button onClick={() => setShowCreate(true)}>Adicionar produto</Button>
      ) : null}
    </div>
  );
}
