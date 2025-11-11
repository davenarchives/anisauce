# AniSauce Documentation

## Screenshots
![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)


## Overview

AniSauce is a Next.js 16 web application that helps users "find the sauce" for anime screenshots. It accepts still frames via drag-and-drop, clipboard paste, direct URL entry, or manual file selection, queries the [trace.moe](https://trace.moe) reverse-image search API, enriches matches with [AniList](https://anilist.co) metadata, and renders an immersive preview card that highlights the probable title, episode, timestamp, synopsis, and similarity score. The app is optimized for quick, keyboard-friendly searches, includes dark/light theming, and persists the most recent result in `sessionStorage` so the `/preview` route can be refreshed independently from the landing page.

## Core Features

- **Multi-input search surface** - `SearchForm` accepts pasted URLs, typed text, and `ctrl/cmd + v` clipboard data while `useSauceSearch` also listens for global paste events and drag-and-drop (`handleDragEnter/Leave/Over/Drop`) to route either an image file or a URL into the same search pipeline.
- **Status-driven UX** - `SearchStatus` displays contextual, optimistic updates such as "Contacting trace.moe..." and error guidance supplied by the hook, keeping the user informed through every asynchronous phase.
- **Trace.moe + AniList enrichment** - `searchTraceMatch` hits trace.moe (with optional API key headers) and `buildResultFromMatch` merges its response with the AniList GraphQL API so the preview card can show cover art, banners, synopsis, score, and outbound links.
- **Result hand-off to `/preview`** - `saveResult` writes the resolved `SearchResult` into `sessionStorage`. The `/preview` page loads it (`loadResult`) on mount, renders either an auto-playing clip or the fallback still frame, and exposes quick navigation (`new search`, `view on anilist`).
- **Media-friendly preview** - `buildVideoUrl` ensures trace.moe-provided MP4s load with a large size parameter, while `formatTimestamp` converts second offsets into `mm:ss` for the "Sauce" line.
- **Theme system** - `ThemeProvider` + `ThemeToggle` synchronize the chosen theme to `localStorage`, update the `data-theme` attribute, and ensure a flicker-free initial render via an inline `<Script>` in `app/layout.tsx`. CSS custom properties in `app/globals.css` drive both palettes.

## Architecture at a Glance

| Layer | Responsibility | Key Files |
| --- | --- | --- |
| App shell | Root layout, fonts, Font Awesome, theme bootstrapping | `app/layout.tsx`, `app/globals.css` |
| Search feature module | UI components, hook orchestration, service layer, utilities | `app/features/search/**` |
| Theme feature module | Context provider and toggle control | `app/features/theme/**` |
| Shared library utilities | API clients, storage, media helpers, formatting | `app/lib/*.ts`, `app/types.ts` |
| Routes | `app/page.tsx` mounts `SauceSearchScreen`; `app/preview/page.tsx` renders stored results | `app/page.tsx`, `app/preview/page.tsx` |

The primary data flow is:

1. User provides an image (file, drop, paste, or URL) through `SauceSearchScreen`.
2. `useSauceSearch` normalizes the payload and calls `searchTraceMatch`.
3. On success, `buildResultFromMatch` enriches the match with AniList data and writes it via `saveResult`.
4. The user is redirected to `/preview`, which reads the cached result and displays the media card with optional streaming clip.

## External Services & Data Handling

- **trace.moe REST API** - Queried through an Axios instance (`traceInstance`) defined in `app/lib/api.ts`. An optional API key can be provided via `NEXT_PUBLIC_API_KEY`, `NEXT_PUBLIC_TRACE_KEY`, or `API_KEY`, added to the `x-trace-key` header automatically.
- **AniList GraphQL API** - Queried via `aniListInstance` using the bundled `ANI_LIST_QUERY`. Failures are caught and logged, falling back to trace.moe metadata when AniList is unavailable.
- **Browser storage** - `sessionStorage` retains the last successful search result; `localStorage` stores the user's theme preference.

## Tech Stack

- **Framework** - Next.js 16 (App Router) with React 19 and TypeScript 5.
- **Styling** - Global CSS variables plus CSS Modules (`app/page.module.css`) for scoped layouts; Google Fonts via `next/font`.
- **HTTP client** - Axios 1.13 for both REST and GraphQL calls.
- **Tooling** - ESLint 9 w/ `eslint-config-next`, Tailwind/PostCSS dependencies (not currently activated), and TypeScript project references via `tsconfig.json`.
- **Fonts & Icons** - `next/font` for Inter + New Rocker, Font Awesome CDN for icons.

## Local Development

### Prerequisites
- Node.js 20+ (recommended for Next.js 16)
- npm (ships with Node)

### Setup & Scripts
```bash
npm install        # install dependencies
npm run dev        # start development server on http://localhost:3000
npm run build      # production build
npm run start      # serve production build
npm run lint       # lint the codebase
```

### Environment Variables

Create a `.env.local` file if you need authenticated trace.moe access:

```
NEXT_PUBLIC_TRACE_KEY=your_trace_moe_key
# or NEXT_PUBLIC_API_KEY / API_KEY - any of the three keys will be picked up
```

All variables are read client-side, so prefer the `NEXT_PUBLIC_*` names.

## Usage Workflow

1. Launch the dev server and open the root page.
2. Provide an image:
   - Paste a URL into the field or press `ctrl/cmd + v` directly on the page.
   - Drag an image file anywhere in the window.
   - Click the folder button to browse for a screenshot.
3. Watch the status text for progress ("Contacting trace.moe...", "Fetching anime details...").
4. After a match is found, you are redirected to `/preview`, where you can:
   - View the static frame or auto-playing clip (toggle sound with the speaker button).
   - Read the AniList synopsis, score, and metadata.
   - Jump to the AniList page via the action link.
5. Use "new search" to return to the landing page; the previous result stays cached until you run another query or clear session storage.

## Accessibility & UX Notes

- Keyboard access is preserved via semantic `<button>`s and `<input>`s; drag indicators (`styles.screenDrag`) provide visual feedback.
- Theme data attributes plus `color-scheme` updates ensure form controls adapt to each palette.
- Errors such as invalid URLs or unsupported file types are surfaced immediately in-line.

## License

No explicit license file or `license` entry is present in `package.json`. Until a license is added, the project should be treated as **all rights reserved** and contributions or redistribution should be cleared with the repository owner.
