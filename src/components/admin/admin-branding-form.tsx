"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import type { AdminStrings } from "@/lib/i18n/app";
import {
  PUBLIC_MENU_BACKGROUND_STYLES,
  PUBLIC_MENU_CARD_STYLES,
  PUBLIC_MENU_CART_STYLES,
  PUBLIC_MENU_DENSITIES,
  PUBLIC_MENU_HERO_STYLES,
  PUBLIC_MENU_TEMPLATES,
  PUBLIC_MENU_TEMPLATE_LABELS,
  getPublicMenuTemplateTokens,
  type PublicMenuBackgroundStyle,
  type PublicMenuCardStyle,
  type PublicMenuCartStyle,
  type PublicMenuDensity,
  type PublicMenuHeroStyle,
  type PublicMenuTemplate,
} from "@/lib/public-menu/templates";
import { LANGUAGES, type Language } from "@/types/database";

interface BrandingState {
  logoUrl: string;
  coverImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  welcomeMessage: string;
  defaultLanguage: Language;
  enabledLanguages: Language[];
  publicMenuTemplate: PublicMenuTemplate;
  publicMenuDensity: PublicMenuDensity;
  publicMenuCardStyle: PublicMenuCardStyle;
  publicMenuHeroStyle: PublicMenuHeroStyle;
  publicMenuBackgroundStyle: PublicMenuBackgroundStyle;
  publicMenuCartStyle: PublicMenuCartStyle;
  publicMenuShowImages: boolean;
}

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export function AdminBrandingForm({
  restaurantId,
  initial,
  labels,
  previewToken,
}: {
  restaurantId: string;
  initial: BrandingState;
  labels: AdminStrings;
  previewToken: string | null;
}) {
  const [form, setForm] = useState<BrandingState>(initial);
  const [saved, setSaved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { run, pending, error } = useApiAction();

  const previewTokens = getPublicMenuTemplateTokens({
    template: form.publicMenuTemplate,
    density: form.publicMenuDensity,
    cardStyle: form.publicMenuCardStyle,
    heroStyle: form.publicMenuHeroStyle,
    backgroundStyle: form.publicMenuBackgroundStyle,
    cartStyle: form.publicMenuCartStyle,
    showImages: form.publicMenuShowImages,
  });

  const templateLabel = PUBLIC_MENU_TEMPLATE_LABELS[form.publicMenuTemplate];

  function toggleLanguage(lang: Language) {
    setForm((f) => {
      const enabled = f.enabledLanguages.includes(lang)
        ? f.enabledLanguages.filter((l) => l !== lang)
        : [...f.enabledLanguages, lang];
      return { ...f, enabledLanguages: enabled };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setLocalError(null);

    if (
      !HEX_REGEX.test(form.primaryColor) ||
      !HEX_REGEX.test(form.backgroundColor) ||
      (form.secondaryColor && !HEX_REGEX.test(form.secondaryColor))
    ) {
      setLocalError("Colors must be 6-digit hex values like #b45309.");
      return;
    }
    if (form.enabledLanguages.length === 0) {
      setLocalError("Enable at least one language.");
      return;
    }
    if (!form.enabledLanguages.includes(form.defaultLanguage)) {
      setLocalError("The default language must be one of the enabled languages.");
      return;
    }

    const ok = await run(`/api/admin/restaurants/${restaurantId}/branding/update`, {
      logo_url: form.logoUrl.trim(),
      cover_image_url: form.coverImageUrl.trim(),
      primary_color: form.primaryColor,
      secondary_color: form.secondaryColor.trim() || null,
      background_color: form.backgroundColor,
      welcome_message: form.welcomeMessage,
      default_language: form.defaultLanguage,
      enabled_languages: form.enabledLanguages,
      public_menu_template: form.publicMenuTemplate,
      public_menu_density: form.publicMenuDensity,
      public_menu_card_style: form.publicMenuCardStyle,
      public_menu_hero_style: form.publicMenuHeroStyle,
      public_menu_background_style: form.publicMenuBackgroundStyle,
      public_menu_cart_style: form.publicMenuCartStyle,
      public_menu_show_images: form.publicMenuShowImages,
    });
    if (ok) setSaved(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <Card className="max-w-2xl">
        <CardContent>
          <p className="mb-4 text-xs text-slate-500">{labels.restaurantBrandingNote}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="logo">{labels.logoUrl}</Label>
              <Input
                id="logo"
                type="url"
                placeholder="https://…/logo.png"
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="cover">{labels.coverUrl}</Label>
              <Input
                id="cover"
                type="url"
                placeholder="https://…/cover.jpg"
                value={form.coverImageUrl}
                onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ColorField
                id="primary"
                label={labels.primaryColor}
                value={form.primaryColor}
                fallback="#111827"
                onChange={(v) => setForm((f) => ({ ...f, primaryColor: v }))}
              />
              <ColorField
                id="secondary"
                label={labels.secondaryColor}
                value={form.secondaryColor}
                fallback="#374151"
                onChange={(v) => setForm((f) => ({ ...f, secondaryColor: v }))}
              />
              <ColorField
                id="background"
                label={labels.backgroundColor}
                value={form.backgroundColor}
                fallback="#ffffff"
                onChange={(v) => setForm((f) => ({ ...f, backgroundColor: v }))}
              />
            </div>
            <div>
              <Label htmlFor="welcome">{labels.welcomeMessage}</Label>
              <Textarea
                id="welcome"
                maxLength={300}
                value={form.welcomeMessage}
                onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))}
              />
            </div>

            <fieldset className="rounded-lg border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-800">
                {labels.templatePreset}
              </legend>
              <div className="mt-2 space-y-3">
                <div>
                  <Label htmlFor="template">{labels.templatePreset}</Label>
                  <Select
                    id="template"
                    value={form.publicMenuTemplate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        publicMenuTemplate: e.target.value as PublicMenuTemplate,
                      }))
                    }
                  >
                    {PUBLIC_MENU_TEMPLATES.map((tpl) => (
                      <option key={tpl} value={tpl}>
                        {PUBLIC_MENU_TEMPLATE_LABELS[tpl].en}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-slate-500">{templateLabel.intent}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    id="density"
                    label={labels.density}
                    value={form.publicMenuDensity}
                    options={PUBLIC_MENU_DENSITIES}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, publicMenuDensity: v as PublicMenuDensity }))
                    }
                  />
                  <SelectField
                    id="card-style"
                    label={labels.cardStyle}
                    value={form.publicMenuCardStyle}
                    options={PUBLIC_MENU_CARD_STYLES}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, publicMenuCardStyle: v as PublicMenuCardStyle }))
                    }
                  />
                  <SelectField
                    id="hero-style"
                    label={labels.heroStyle}
                    value={form.publicMenuHeroStyle}
                    options={PUBLIC_MENU_HERO_STYLES}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, publicMenuHeroStyle: v as PublicMenuHeroStyle }))
                    }
                  />
                  <SelectField
                    id="bg-style"
                    label={labels.backgroundStyle}
                    value={form.publicMenuBackgroundStyle}
                    options={PUBLIC_MENU_BACKGROUND_STYLES}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        publicMenuBackgroundStyle: v as PublicMenuBackgroundStyle,
                      }))
                    }
                  />
                  <SelectField
                    id="cart-style"
                    label={labels.cartStyle}
                    value={form.publicMenuCartStyle}
                    options={PUBLIC_MENU_CART_STYLES}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, publicMenuCartStyle: v as PublicMenuCartStyle }))
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.publicMenuShowImages}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, publicMenuShowImages: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {labels.showProductImages}
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-medium text-slate-600">
                {labels.menuLanguages}
              </legend>
              <div className="flex flex-wrap gap-4">
                {LANGUAGES.map((lang) => (
                  <label key={lang} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.enabledLanguages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {LANGUAGE_LABELS[lang]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="w-48">
              <Label htmlFor="default-language">{labels.defaultLanguage}</Label>
              <Select
                id="default-language"
                value={form.defaultLanguage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, defaultLanguage: e.target.value as Language }))
                }
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </option>
                ))}
              </Select>
            </div>

            <FieldError message={localError ?? error} />
            {saved ? <p className="text-xs font-medium text-emerald-600">{labels.saved}</p> : null}
            <Button type="submit" disabled={pending}>
              {pending ? labels.saving : labels.saveBranding}
            </Button>
          </form>
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {labels.templateIntent}
            </p>
            <div
              className="mt-3 overflow-hidden rounded-2xl border shadow-sm"
              style={{ background: previewTokens.pageBackground }}
            >
              <div
                className="h-16"
                style={{
                  background: `linear-gradient(140deg, ${form.primaryColor}, ${form.secondaryColor || form.primaryColor})`,
                }}
              />
              <div
                className="mx-3 -mt-4 rounded-xl border p-2 shadow-md"
                style={{
                  backgroundColor: previewTokens.identityCardBg,
                  borderColor: previewTokens.identityCardBorder,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg"
                    style={{ backgroundColor: form.primaryColor }}
                  />
                  <div className="min-w-0">
                    <div
                      className="h-2 w-20 rounded"
                      style={{ backgroundColor: previewTokens.textPrimary, opacity: 0.8 }}
                    />
                    <div
                      className="mt-1 h-1.5 w-12 rounded"
                      style={{ backgroundColor: previewTokens.textMuted }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2 p-3 pt-4">
                <div
                  className={`${previewTokens.cardRadius} border p-2`}
                  style={{
                    backgroundColor: previewTokens.surface,
                    borderColor: previewTokens.surfaceBorder,
                  }}
                >
                  <div className="flex gap-2">
                    {form.publicMenuShowImages ? (
                      <div
                        className="h-10 w-10 shrink-0 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${form.primaryColor}33, ${form.secondaryColor || form.primaryColor}55)`,
                        }}
                      />
                    ) : null}
                    <div className="flex-1">
                      <div
                        className="h-2 w-16 rounded"
                        style={{ backgroundColor: previewTokens.textPrimary, opacity: 0.7 }}
                      />
                      <div
                        className="mt-1 h-1.5 w-10 rounded"
                        style={{ backgroundColor: form.primaryColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">{templateLabel.intent}</p>
          </CardContent>
        </Card>

        {previewToken ? (
          <Link
            href={`/t/${previewToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            {labels.previewPublicMenu} ↗
          </Link>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            {labels.createTableFirst}
          </p>
        )}
      </aside>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  fallback,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Pick ${label}`}
          value={HEX_REGEX.test(value) ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded border border-slate-300"
        />
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.replace(/_/g, " ")}
          </option>
        ))}
      </Select>
    </div>
  );
}
