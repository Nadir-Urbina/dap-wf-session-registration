# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5 application built with React 19, TypeScript, and Tailwind CSS v4. The project is named "session-scheduler" and uses the Next.js App Router architecture.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

## Architecture

### Framework & Routing
- **Next.js App Router**: Uses the `src/app` directory structure for file-based routing
- **Server Components by default**: All components in the app directory are React Server Components unless marked with "use client"
- The main entry point is `src/app/page.tsx` with layout defined in `src/app/layout.tsx`

### Styling
- **Tailwind CSS v4**: Uses the new inline `@theme` directive syntax in `globals.css`
- **PostCSS**: Configured with `@tailwindcss/postcss` plugin
- **CSS Variables**: Theme colors (`--background`, `--foreground`) defined in `globals.css` with dark mode support via `prefers-color-scheme`
- **Fonts**: Uses Next.js font optimization with Geist Sans and Geist Mono from Google Fonts

### TypeScript Configuration
- **Path Alias**: `@/*` maps to `./src/*` - use this for imports (e.g., `import { Component } from '@/components/Component'`)
- **Strict mode enabled**: Full TypeScript strict checks are on
- **Module Resolution**: Uses "bundler" mode (ESM-first)
- **Target**: ES2017

### ESLint
- Uses Next.js recommended configs: `next/core-web-vitals` and `next/typescript`
- Configured with flat config format (eslint.config.mjs)
- Ignores: `node_modules`, `.next`, `out`, `build`, `next-env.d.ts`

## Project Structure

```
src/
  app/
    layout.tsx       # Root layout with font configuration and metadata
    page.tsx         # Home page (route: /)
    globals.css      # Global styles and Tailwind imports
    favicon.ico      # Site favicon
```

## Key Technologies

- **React 19.1.0**: Latest React with new features
- **Next.js 15.5.4**: Latest App Router with React Server Components
- **TypeScript 5**: Full type safety
- **Tailwind CSS 4**: Latest version with new inline theme syntax
- **ESLint 9**: Latest ESLint with flat config

## Development Notes

- The project is a fresh Next.js installation with default starter content
- Hot reload is enabled via `npm run dev` - changes to files auto-update in browser
- Static assets go in the `public/` directory (at project root)
- API routes would be created in `src/app/api/` following App Router conventions
- Server Actions can be defined inline in Server Components or in separate files with "use server" directive
