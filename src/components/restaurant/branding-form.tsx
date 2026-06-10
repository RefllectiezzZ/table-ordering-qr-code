"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { LANGUAGE_LABELS } from "@/lib/i18n";
import { LANGUAGES, type Language } from "@/types/database";

interface BrandingState {
  logoUrl: string;
  coverImageUrl: string;
  primaryColor: string;
  backgroundColor: string;
  welcomeMessage: string;
  defaultLanguage: Language;
  enabledLanguages: Language[];
}

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export function BrandingForm({ initial }: { initial: BrandingState }) {
  const [form, setForm] = useState<BrandingState>(initial);
  const [saved, setSaved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { run, pending, error } = useApiAction();

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

    if (!HEX_REGEX.test(form.primaryColor) || !HEX_REGEX.test(form.backgroundColor)) {
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

    const ok = await run("/api/restaurant/branding/update", {
      logo_url: form.logoUrl.trim(),
      cover_image_url: form.coverImageUrl.trim(),
      primary_color: form.primaryColor,
      background_color: form.backgroundColor,
      welcome_message: form.welcomeMessage,
      default_language: form.defaultLanguage,
      enabled_languages: form.enabledLanguages,
    });
    if (ok) setSaved(true);
  }

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              type="url"
              placeholder="https://…/logo.png"
              value={form.logoUrl}
              onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cover">Cover image URL</Label>
            <Input
              id="cover"
              type="url"
              placeholder="https://…/cover.jpg"
              value={form.coverImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="primary">Primary color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick primary color"
                  value={HEX_REGEX.test(form.primaryColor) ? form.primaryColor : "#111827"}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="h-9 w-10 cursor-pointer rounded border border-slate-300"
                />
                <Input
                  id="primary"
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="background">Background color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick background color"
                  value={HEX_REGEX.test(form.backgroundColor) ? form.backgroundColor : "#ffffff"}
                  onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
                  className="h-9 w-10 cursor-pointer rounded border border-slate-300"
                />
                <Input
                  id="background"
                  value={form.backgroundColor}
                  onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="welcome">Welcome message</Label>
            <Textarea
              id="welcome"
              maxLength={300}
              value={form.welcomeMessage}
              onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))}
              placeholder="Bem-vindo! Faça o seu pedido diretamente da mesa."
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-slate-600">Menu languages</legend>
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
            <Label htmlFor="default-language">Default language</Label>
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
          {saved ? <p className="text-xs font-medium text-emerald-600">Saved.</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save branding"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
