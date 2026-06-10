# Translation CSV — Format & Rules

Stable contract for the export/import workflow on `/restaurant/translations`.
Implementation: `src/lib/csv/translation-csv.ts` (keep both in sync).

## Columns (exact set; order-insensitive on import, matched by header name)

```
product_id,category_id,category_pt,name_pt,description_pt,price,allergens,
name_en,description_en,category_en,name_es,description_es,category_es,
name_fr,description_fr,category_fr
```

One row per product. Encoding UTF-8 (BOM tolerated), RFC 4180 quoting,
`\r\n` or `\n` line endings.

## Column semantics

| Column | On export | On import |
| --- | --- | --- |
| `product_id` | product UUID | **Required.** Row identity. Must belong to your restaurant. Do not edit. |
| `category_id` | category UUID or empty | Optional. Identifies which category the `category_*` names update. Do not edit. |
| `price` | decimal EUR (e.g. `3.50`) | **Ignored.** Prices are never updated via translation import. |
| `allergens` | stable codes joined with `\|` (e.g. `gluten\|milk`) | **Ignored.** Allergen codes are never free-translated or updated here. |
| `name_xx` | product name in language xx | Updates the product translation if non-empty. Empty = language untouched. |
| `description_xx` | product description | Written together with `name_xx`. Empty description clears the stored one. A description without a name is skipped with a warning. |
| `category_xx` | category name | Updates the category translation (by `category_id`) if non-empty. |

Languages: `pt`, `en`, `es`, `fr`.

## Matching rules

- Translations are matched **strictly by ID** (`product_id` / `category_id`) —
  never by name.
- IDs that do not exist **in your restaurant** make the row invalid. This also
  means a CSV from another restaurant cannot touch your data, and yours cannot
  touch theirs (re-verified by RLS at write time).
- Duplicate category translations across rows are deduplicated (last row wins).

## Preview & commit

1. `POST /api/restaurant/translations/preview` stages the file as an
   `import_batches` row (status `preview`) with one `import_rows` entry per CSV
   row. The response reports: rows found, valid/warning/invalid counts, matched
   product/category IDs, unknown IDs, and the exact fields each row would update.
2. Nothing is written to the menu at preview time.
3. `POST /api/restaurant/translations/commit` applies a previewed batch.
   - Blocked with HTTP 409 if any row is invalid, unless `skip_unknown: true`
     is sent explicitly (the UI exposes this as a checkbox).
   - Upserts run on the user-scoped client → RLS enforces tenant ownership.
   - The batch becomes `committed` and cannot be committed again.

## Recommended workflow

1. Export the CSV.
2. Translate the `name_*`, `description_*`, `category_*` columns (manually or
   with AI assistance) — leave `product_id`, `category_id`, `price`, `allergens`
   untouched.
3. Import, read the preview carefully, commit.
4. Verify on the public menu with the language switcher.
