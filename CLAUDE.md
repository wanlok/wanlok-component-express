# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — run the server with `ts-node-dev` (auto-restarts on change). This is the only run command; there is no build script (no `tsc` step wired into `package.json`, despite `tsconfig.json` defining an `outDir`).
- `npx tsc --noEmit` — typecheck (use this to verify changes compile; there's no dedicated lint script).
- `npm test` is an unconfigured stub (`exit 1`) — there are no tests in this repo.
- No linter is configured; `.prettierrc` sets formatting only (2-space, no tabs, no trailing commas, printWidth 120).

## Architecture

This is a small Express/TypeScript HTTPS server that acts as a grab-bag of scraping/automation/media utility endpoints for the author's other static sites (CORS is locked to `http://localhost:3001` and `https://wanlok.github.io`). It always runs over HTTPS using a local cert (`CERT_DIRECTORY_PATH/privkey.pem` + `fullchain.pem`) on port 443 — there's no HTTP fallback.

**Routing**: all routes are registered directly in `src/index.ts`; handlers live one-per-file in `src/handlers/` and shared logic in `src/utils/`. There's no router/controller layering beyond that.

**Config (`src/utils/config.ts`)**: all runtime paths (cert dir, upload dir, screenshot dir, Chrome executable, a local GitHub repo clone path) and third-party credentials come from `.env` via `dotenv`. Nothing has a real default — missing env vars silently resolve to `""`, so file operations/logins will fail loudly rather than falling back.

**The "copy to GitHub" side effect**: both `uploadHandler.ts` and `screenshotHandler.ts` write their output (uploaded files / screenshots) into local disk dirs, then also copy the same file into a *second* location under `githubDirectoryPath` (a local clone of a GitHub Pages repo) and call `commit()` from `FileUtils.ts`. `commit()` pushes a `git pull && git add . && git commit -m "commit" || true && git push` job onto a single-concurrency `p-queue`, so git operations across concurrent requests are serialized rather than run in parallel. Any change to upload/screenshot handling needs to account for this real git push side effect — it's not just local file I/O.

**Content-addressable storage**: uploaded files and screenshots are both keyed by MD5 hash (of file contents for uploads, of the source URL for screenshots) rather than random IDs, so re-uploading identical content or re-screenshotting the same URL overwrites/reuses the same file.

**Two browser-automation stacks coexist, split by purpose**:
- `pdf.ts` and `screenshotHandler.ts` use **Puppeteer** (`puppeteer-extra` + stealth plugin for `screenshotHandler.ts` specifically, since it screenshots third-party pages rather than the author's own) for one-shot render/screenshot/PDF jobs. Screenshot input URLs that resolve to `content-type: application/pdf` are instead rasterized via `PDFUtils.ts` (pdfjs-dist + `canvas`) and cropped to 16:9 — Puppeteer is only used for non-PDF URLs.
- `vuforiaHandler.ts` uses **Playwright** for multi-step authenticated browser flows (log into the Vuforia Engine Developer Portal, navigate to a specific database, screenshot the result). Both browsers are launched pointing at the same local `CHROME_EXECUTABLE_PATH` system Chrome rather than a bundled/downloaded binary.
- When extending `vuforiaHandler.ts`-style flows: prefer real DOM ids over accessible-name/role text matching where possible (page text/labels are more likely to change or be ambiguous — e.g. the login fields are placeholder-only inputs with no real `<label>`, so `getByLabel` silently fails to match while `getByRole`/`locator("#id")` do). `pressSequentially(text, { delay })` plus `page.waitForTimeout()` between steps is used to pace interactions like a human rather than instant `.fill()`. Client-side SPA navigation (no full page load) means `waitForLoadState("networkidle")` is unreliable for "did the action complete" — use `page.waitForURL()` against the expected resulting path instead.

**Known rough edge**: `src/utils/FileUtils.ts` is a CommonJS module that `require()`s the ESM-only `p-queue` package, which triggers a Node experimental-warning at startup. This is expected/known, not a bug to fix reflexively.
