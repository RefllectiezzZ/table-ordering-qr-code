# Dependency security advisories

## PostCSS (moderate) — accepted via Next.js

**Advisory:** [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)  
**Package:** `postcss` &lt; 8.5.10 (XSS via unescaped `</style>` in CSS stringify output)  
**Severity:** moderate

### Dependency chain

```
table-ordering-qr-code
└── next@16.2.9
    └── postcss (bundled under node_modules/next/node_modules/postcss)
```

`npm audit` reports 2 moderate vulnerabilities (duplicate paths through `next`).

### Remediation status

- `npm audit fix --force` would install `next@9.3.3` — a **breaking downgrade**. Not acceptable.
- There is no safe non-breaking patch within the current Next.js 16.x line at the time of this audit.
- PostCSS is not invoked directly by application code; exposure is limited to Next.js build/runtime internals.

### Action

- **Do not** run `npm audit fix --force`.
- **Do not** downgrade Next.js to silence the audit.
- Revisit on the next Next.js patch/minor release that bundles `postcss` ≥ 8.5.10.
- Run `npm audit` and `npm audit --omit=dev` in CI before releases.

### Last reviewed

2026-06-11 — advisory accepted as temporary, documented, no unsafe force fix applied.
