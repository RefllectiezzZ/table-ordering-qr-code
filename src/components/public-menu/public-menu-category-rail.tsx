"use client";

import type { PublicMenuTemplateTokens } from "@/lib/public-menu/templates";
import { readableTextColor } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";
import type { PublicCategory } from "@/types/public-menu";

interface PublicMenuCategoryRailProps {
  categories: PublicCategory[];
  activeCategory: string | null;
  categoryName: (category: PublicCategory) => string;
  primary: string;
  tokens: PublicMenuTemplateTokens;
  onSelect: (categoryId: string) => void;
}

export function PublicMenuCategoryRail({
  categories,
  activeCategory,
  categoryName,
  primary,
  tokens,
  onSelect,
}: PublicMenuCategoryRailProps) {
  const onPrimary = readableTextColor(primary);

  return (
    <nav
      className="sticky top-0 z-20 mt-5 border-b backdrop-blur-md"
      style={{
        backgroundColor: tokens.categoryRailBg,
        borderColor: tokens.surfaceBorder,
      }}
    >
      <div className="scrollbar-none mx-auto flex w-full max-w-lg gap-2 overflow-x-auto px-4 py-2.5">
        {categories.map((category) => {
          const active = activeCategory === category.id;
          return (
            <a
              key={category.id}
              href={`#cat-${category.id}`}
              onClick={() => onSelect(category.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center px-4 text-xs font-semibold transition-all",
                tokens.placeholderStyle === "minimal"
                  ? active
                    ? "border-b-2 font-bold"
                    : "border-b-2 border-transparent"
                  : "rounded-full border",
                !active && tokens.categoryPillInactive,
              )}
              style={
                active
                  ? {
                      backgroundColor:
                        tokens.placeholderStyle === "minimal" ? "transparent" : primary,
                      color:
                        tokens.placeholderStyle === "minimal" ? primary : onPrimary,
                      borderColor: tokens.placeholderStyle === "minimal" ? primary : "transparent",
                      boxShadow: tokens.categoryPillActiveShadow,
                    }
                  : {}
              }
            >
              {categoryName(category)}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
