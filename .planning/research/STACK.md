# Technology Stack

**Project:** Astoria Runners - Run Club Planning Tool
**Domain:** Event Scheduling & Route Management
**Researched:** 2026-02-12
**Overall Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.5+ | Full-stack React framework | Industry standard for 2025; React Server Components (RSC) reduce client-side JS, App Router provides file-based routing, built-in API routes, excellent TypeScript support, and Vercel deployment optimization. Version 15 stable with React 19 support, Turbopack performance improvements, and improved hydration. |
| React | 19+ | UI library | Required by Next.js 15; improved concurrent rendering and server components support. |
| TypeScript | 5.5+ | Type safety | Catches errors at compile-time, improves maintainability for growing codebases. Strict mode prevents common bugs. Essential for schema validation with Zod and tRPC type inference. |
| Node.js | 20 LTS | Runtime environment | Current LTS version; required minimum for Next.js 15. Provides stability for production deployments. |

**Rationale:** Next.js 15 with TypeScript is the 2025 standard for full-stack React applications. The framework handles routing, API routes, SSR/SSG, and optimizations out-of-box. For a budget-sensitive POC that will later integrate with an existing website, Next.js provides both rapid prototyping and production-ready scalability.

### Database & ORM

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PostgreSQL | 15+ | Primary database | Industry standard RDBMS; excellent for structured data (routes, events, metadata). Supports JSON fields for flexible GPX storage, has robust querying for calendar/scheduling, and is available on all major hosting platforms. Free tier on Vercel Postgres, Supabase, or Railway. |
| Prisma ORM | 7.3+ | Database toolkit | Current version (released Nov 2025) with improved performance and DX. Type-safe database queries auto-generated from schema. Excellent TypeScript integration, visual Studio tool, and migration system. Version 7 is Rust-free for simpler deployments. |

**Rationale:** PostgreSQL + Prisma is the 2025 gold standard for Next.js applications. Prisma provides type safety from database to frontend, automatic migrations, and excellent DX. PostgreSQL's maturity ensures reliable scheduling without data conflicts (addressing the Google Sheets failure). JSON fields allow flexible GPX metadata storage without complex schema changes.

### API Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| tRPC | 11+ | Type-safe API | End-to-end type safety without code generation. Procedures defined once, types automatically inferred on client. Perfect for Next.js monorepo where client and server share codebase. Eliminates REST boilerplate and manual API contracts. Zero network overhead for Server Components. |
| Zod | 3.23+ | Schema validation | TypeScript-first validation library (2kb gzipped). Validates API inputs, form data, and environment variables at runtime. Integrates seamlessly with tRPC, Prisma, and React Hook Form. Infers TypeScript types from schemas, eliminating duplication. |

**Rationale:** tRPC + Zod provides full-stack type safety from database to UI. This eliminates entire classes of bugs (mismatched API contracts, validation errors) and provides excellent autocomplete in IDEs. For a small team/solo developer, this drastically reduces debugging time.

### Frontend UI

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tailwind CSS | 4.1+ | Styling framework | Version 4 (released Jan 2025) with 5x faster builds, CSS-first configuration using @theme directive, and modern OKLCH color space. Zero-config setup eliminates tailwind.config.js. Utility-first approach enables rapid prototyping and consistent design. |
| shadcn/ui | Latest | Component library | Copy-paste component library (not npm dependency) built on Radix UI primitives. Fully customizable, accessible by default, and styled with Tailwind. In 2025, added 7 new components including Spinner, Button Group, Field, and Empty. Eliminates need to build common UI patterns from scratch. |
| react-big-calendar | 1.19+ | Calendar view component | Industry standard for event calendar UIs (like Google Calendar/Calendly). Supports multiple views (month/week/day/agenda), drag-and-drop, custom styling, and flexible localization. Well-maintained with 8k+ GitHub stars. |
| Leaflet | 1.9+ | Map display | Lightweight (~40kb), open-source mapping library. No API keys required (unlike Google Maps). Supports custom tile layers (OpenStreetMap) and extensive plugin ecosystem. |
| react-leaflet | 4.2+ | React wrapper for Leaflet | Official React bindings for Leaflet; declarative API using React components. Actively maintained and compatible with React 19. |
| leaflet-gpx | 2.1+ | GPX track rendering | Parses and displays GPX files on Leaflet maps. Extracts elevation, distance, time, and heart-rate data. Customizable markers for start/end points. |

**Rationale:** This UI stack prioritizes rapid development without sacrificing quality. Tailwind v4 + shadcn/ui enable fast prototyping with production-ready components. react-big-calendar is the proven solution for scheduling UIs. Leaflet + react-leaflet + leaflet-gpx provide complete GPX route visualization without paid APIs (critical for budget-sensitive POC).

### Date & Time Handling

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 3.6+ | Date manipulation | Primary date library. Functional API, tree-shakeable (smaller bundles), excellent TypeScript support. Use for formatting, calculations, and calendar logic. |
| date-fns-tz | 3.2+ | Timezone support | Timezone-aware date operations. Critical for scheduling across timezones if runners/organizers are distributed. |

**Rationale:** date-fns is more performant and tree-shakeable than alternatives (Day.js, Moment.js). For calendar/scheduling applications, date-fns + date-fns-tz provide robust timezone handling without bloating bundle size. react-big-calendar recommends date-fns localizer.

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| NextAuth.js (Auth.js) | 5+ | Authentication | Version 5 (rebranded as Auth.js) simplifies auth to single auth() function call. Supports OAuth providers (Google, GitHub) and credentials. Built for Next.js App Router and Server Components. Session management, CSRF protection, and JWT handling included. |

**Rationale:** For MVP, authentication may only be needed for organizers (public views are read-only). NextAuth v5 provides production-ready auth with minimal setup. Can start with OAuth (Google) and add more providers later.

### External API Integrations

| Integration | Purpose | Approach |
|-------------|---------|----------|
| Strava API | Import routes/GPX data | Use Strava OAuth + REST API. Node.js libraries available (strava-v3). Note: API rate limits require approval for higher tiers (2-week approval process). Store GPX data in PostgreSQL after import to avoid repeated API calls. |
| Discord Webhooks | Post announcements | Use Discord webhook URLs (no OAuth needed for simple posting). Libraries: discord.js for complex bots, or simple fetch() for webhook posts. Can trigger on event creation/updates. |

**Rationale:** Both integrations are well-documented and have Node.js ecosystem support. For POC, start with Strava OAuth for route import and Discord webhooks for announcements. This avoids complex bot infrastructure while delivering core value.

### Form Handling

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Hook Form | 7.53+ | Form state management | Performant uncontrolled forms with minimal re-renders. Excellent TypeScript support and Zod integration via @hookform/resolvers/zod. Use for complex forms (route creation, event scheduling). |

**Rationale:** React Hook Form + Zod provides type-safe form validation with excellent DX. For a scheduling tool with multiple forms (create events, add routes, configure settings), this combination drastically reduces boilerplate.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit/integration testing | Faster than Jest (30-70% runtime reduction), native ESM support, compatible with Jest API. Official Next.js integration. Recommended for 2025. |
| Playwright | E2E testing | Cross-browser testing (Chromium, Firefox, WebKit). Auto-waits for elements (reduces flaky tests). Excellent TypeScript support and debugging tools. Industry standard for modern E2E testing. |
| Prettier | Code formatting | Consistent code style across team. Integrates with ESLint. |
| ESLint | Linting | Next.js ships with ESLint config. Use with Husky for pre-commit hooks. |
| Husky | Git hooks | Automate linting, type-checking, and tests before commits. |

**Rationale:** This testing/tooling stack represents 2025 best practices. Vitest is replacing Jest as the preferred test runner for Vite-based tools. Playwright is the industry standard for E2E testing, surpassing Cypress in adoption.

## Deployment & Hosting

| Platform | Use Case | Why Recommended |
|----------|----------|-----------------|
| Vercel | Production hosting (recommended) | Built by Next.js creators; zero-config deployment, automatic previews, edge functions, and Vercel Postgres integration. Free Hobby plan for non-commercial; $20/month Pro plan for commercial with generous usage limits. Can set $200 budget cap to prevent overages. |
| Supabase | Database hosting (alternative) | Free PostgreSQL hosting with 500MB storage. Easy Prisma integration. Good for POC before migrating to Vercel Postgres. |
| Railway | Full-stack hosting (alternative) | Simple deployment for Next.js + PostgreSQL. $5/month base + usage. Good alternative if Vercel becomes too expensive. |

**Rationale:** Vercel provides the best DX for Next.js applications with true zero-config deployment. For budget-sensitive POC, start with Vercel Hobby (free for personal projects). If commercial usage is required, Pro plan at $20/month with budget cap prevents surprise costs. Vercel's edge network ensures fast global performance for public schedule views.

## Installation

```bash
# Initialize Next.js 15 with TypeScript, Tailwind, and App Router
npx create-next-app@latest astoria-runners --typescript --tailwind --app --use-npm

# Core dependencies
npm install @prisma/client @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod

# UI & Calendar
npm install react-big-calendar date-fns date-fns-tz react-hook-form @hookform/resolvers

# Maps & GPX
npm install leaflet react-leaflet leaflet-gpx

# shadcn/ui (follow their CLI setup)
npx shadcn@latest init
npx shadcn@latest add button calendar card form input select

# Authentication
npm install next-auth@beta

# Dev dependencies
npm install -D prisma vitest @vitejs/plugin-react @testing-library/react @playwright/test prettier eslint-config-prettier husky

# Type definitions
npm install -D @types/leaflet @types/react-big-calendar
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Framework | Next.js 15 | Remix, Astro | Next.js has largest ecosystem, best Vercel integration, and proven scalability for dynamic apps. Remix is excellent but smaller ecosystem. Astro is better for content-heavy sites, not web apps. |
| Calendar UI | react-big-calendar | FullCalendar, react-calendar | FullCalendar requires paid license for commercial use ($295/developer). react-calendar is too basic (date picker, not event calendar). react-big-calendar is free, open-source, and feature-complete. |
| ORM | Prisma | Drizzle ORM, TypeORM | Drizzle is gaining traction but has smaller ecosystem and fewer guides. TypeORM has outdated DX compared to Prisma. Prisma's Studio, migrations, and type generation are unmatched. |
| API Layer | tRPC | REST, GraphQL | REST requires manual API contracts and lacks type safety. GraphQL adds complexity (schema language, resolvers, code-gen) without benefits for monorepo where tRPC provides type safety through inference. |
| Map Library | Leaflet | Google Maps, Mapbox | Google Maps requires API key and billing account (costs unpredictable). Mapbox has free tier but requires account. Leaflet is truly free, no account needed, sufficient for displaying GPX routes. |
| Date Library | date-fns | Day.js, Luxon | Day.js has immutable API similar to Moment (easier migration from Moment), but date-fns is more performant and tree-shakeable. Luxon is powerful but heavier (50kb vs 20kb). date-fns strikes best balance. |
| Styling | Tailwind CSS v4 | CSS Modules, Styled Components, Emotion | CSS Modules lack design system. Styled Components and Emotion add runtime overhead. Tailwind v4 provides utility-first DX with zero runtime cost and v4's CSS-first config eliminates JS config files. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Moment.js | Unmaintained since 2020; massive bundle size (67kb); mutable API causes bugs. | date-fns (functional, tree-shakeable) |
| Create React App | No longer recommended by React team; lacks SSR, optimizations, and modern features. | Next.js 15 (official React recommendation) |
| Redux | Overkill for this application size; excessive boilerplate; server state confusion. | React Server Components + tRPC (server state) + React Context (minimal client state) |
| MongoDB | Scheduling data is highly relational (events linked to routes, users, times). Schema-less DB adds complexity. | PostgreSQL (ACID guarantees, relations, JSON support for flexible fields) |
| Vercel Postgres (initially) | Vercel Postgres is Neon under the hood. For POC, start with Supabase (more generous free tier) then migrate to Vercel Postgres in production. | Supabase (POC) → Vercel Postgres (production) |

## Stack Patterns by Variant

**If budget is extremely tight (<$10/month):**
- Use Supabase for database (free tier: 500MB storage)
- Host on Vercel Hobby plan (free for personal projects)
- Use OpenStreetMap tiles for Leaflet (free, no API key)
- Skip paid monitoring/analytics initially
- Total cost: $0 for POC, $5-10/month for light commercial usage

**If team is non-technical (organizers, not developers):**
- Add headless CMS (Payload CMS or Sanity) for content editing
- Provide admin dashboard with forms (React Hook Form + shadcn/ui)
- Use NextAuth OAuth (Google) instead of password auth (less support burden)
- Deploy on Vercel (simplest CI/CD, no DevOps knowledge needed)

**If scaling beyond single club (multi-tenant):**
- Add row-level security in Prisma schema (organizationId foreign key)
- Use Vercel Pro plan ($20/month) for multiple environments (staging/prod)
- Add Redis for caching (Upstash free tier: 10k commands/day)
- Consider migrating to Turborepo monorepo if adding mobile app later

**If integrating with existing WordPress site:**
- Keep Next.js as standalone app (subdomain: app.astoriarunners.com)
- Use WordPress REST API to fetch/display schedule on main site
- Authenticate users via JWT shared between WordPress and Next.js
- Alternatively: Use Next.js only for admin dashboard, embed public schedule via iframe/web component

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.5 | React 19+ | React 19 is required minimum for Next.js 15 |
| Prisma 7.3 | Node.js 18.18+ | Node.js 20 LTS recommended |
| tRPC 11 | @tanstack/react-query 5+ | Requires React Query v5 for client |
| react-big-calendar 1.19 | date-fns 3+ | Use date-fns localizer, not Moment.js |
| NextAuth 5 | Next.js 14+ | Works with App Router and Server Components |
| Tailwind CSS 4.1 | PostCSS 8+ | No longer requires tailwind.config.js file |
| Vitest 2+ | Node.js 18+ | Compatible with Jest API for easy migration |
| shadcn/ui latest | Radix UI, Tailwind CSS 4+ | No versioning; components copy-pasted, not npm package |

## Performance Optimization Notes

1. **React Server Components (RSC):** Use RSC for data fetching (Prisma queries) to reduce client-side JS. Only mark components as 'use client' when needed (forms, interactivity).

2. **Static Generation (SSG):** Generate public schedule pages statically with ISR (Incremental Static Regeneration) every 15 minutes. This serves cached HTML to visitors without database hits.

3. **Image Optimization:** Use Next.js `<Image>` component for route thumbnails. Automatically serves WebP, resizes, and lazy loads.

4. **Bundle Size:** Avoid importing entire libraries. Use tree-shaking: `import { format } from 'date-fns'` not `import * as dateFns`.

5. **Database Indexing:** Add Prisma indexes on frequently queried fields (event date, route category). Critical for calendar view performance.

## Security Considerations

1. **Environment Variables:** Use `.env.local` for secrets (DATABASE_URL, NEXTAUTH_SECRET). Never commit to git. Validate with Zod schemas.

2. **API Rate Limiting:** Implement rate limiting on API routes (especially public schedule endpoints) to prevent abuse. Use Vercel Edge Middleware or Upstash Redis.

3. **SQL Injection:** Prisma prevents SQL injection by default through parameterized queries. Never use raw SQL queries without sanitization.

4. **XSS Protection:** React escapes JSX by default. Be cautious when using `dangerouslySetInnerHTML` for GPX descriptions/notes.

5. **CSRF Protection:** NextAuth includes CSRF tokens. For custom API routes without auth, add CSRF protection manually.

## Migration Path (Existing Google Sheets)

For transitioning from failed Google Sheets setup:

1. **Data Export:** Export existing routes/events from Sheets to CSV
2. **Import Script:** Write Prisma seed script to import CSV data
3. **Validation:** Use Zod schemas to validate imported data (catch inconsistencies)
4. **Parallel Run:** Run new system in parallel with Sheets for 2-4 weeks
5. **Cutover:** Announce deprecation date for Sheets, migrate fully to new system

## Sources

### Stack Research Sources (HIGH Confidence - Official Docs)
- [Next.js 15 Stable Release](https://nextjs.org/blog/next-15) — Framework features
- [Next.js 15.5 Release](https://nextjs.org/blog/next-15-5) — Latest updates
- [Prisma ORM 7 Release](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) — Database toolkit
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) — Styling framework
- [Tailwind v4 Migration Guide](https://ui.shadcn.com/docs/tailwind-v4) — CSS-first config
- [Zod Official Docs](https://zod.dev/) — Schema validation
- [tRPC Documentation](https://trpc.io/) — Type-safe APIs
- [NextAuth v5 Migration](https://authjs.dev/getting-started/migrating-to-v5) — Authentication

### Library Research Sources (HIGH Confidence - npm/GitHub)
- [react-big-calendar npm](https://www.npmjs.com/package/react-big-calendar) — Version 1.19.4
- [leaflet-gpx GitHub](https://github.com/mpetazzoni/leaflet-gpx) — GPX rendering
- [Vitest Official Guide](https://vitest.dev/guide/) — Testing framework
- [Playwright Official Site](https://playwright.dev/) — E2E testing

### Ecosystem Research Sources (MEDIUM Confidence - Web Search)
- [React calendar components for 2025](https://www.builder.io/blog/best-react-calendar-component-ai) — Library comparison
- [Next.js Best Practices 2025](https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices) — Modern patterns
- [Vercel Pricing Breakdown 2025](https://flexprice.io/blog/vercel-pricing-breakdown) — Budget analysis
- [date-fns vs Day.js comparison](https://www.dhiwise.com/post/date-fns-vs-dayjs-the-battle-of-javascript-date-libraries) — Date library analysis
- [Vitest vs Jest 2025](https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9) — Testing comparison
- [Playwright E2E Testing Guide 2026](https://www.deviqa.com/blog/guide-to-playwright-end-to-end-testing-in-2025/) — Testing approach
- [shadcn/ui New Components October 2025](https://ui.shadcn.com/docs/changelog/2025-10-new-components) — UI library updates

### Integration Research Sources (MEDIUM Confidence - Web Search)
- [Strava API Integration Pipedream](https://pipedream.com/apps/strava/integrations/discord) — API integration patterns
- [Discord Strava Bot GitHub](https://github.com/asweinrich/strava-bot) — Integration examples
- [Rendering GPX in React](https://www.manuelkruisz.com/blog/posts/gpx-maps-react) — Implementation guide

---
*Stack research for: Run Club Event Scheduling & Route Management*
*Researched: 2026-02-12*
*Confidence: HIGH (verified with official docs + current versions)*
