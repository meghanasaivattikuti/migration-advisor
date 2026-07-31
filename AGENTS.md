# AGENTS.md

Guidance for coding agents working in this repo. For what the product does and why, see [README.md](README.md).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Vercel AI SDK (`ai`, `@ai-sdk/anthropic`), Zod.

Next.js 16 is newer than most model training data. Before changing routing, metadata, or Route Handlers, check `node_modules/next/dist/docs/` for the current API instead of assuming pre-16 behavior.

## Commands

```bash
npm install
cp .env.example .env.local   # add a real ANTHROPIC_API_KEY
npm run dev
npm run lint
npm run build
```

Lint and build must both pass clean before committing. There is no test suite yet.

## Key files

- `app/page.tsx`: form and streaming results UI, client component.
- `app/api/assess/route.ts`: Route Handler. Validates input, rate limits by IP, calls Claude, streams the response.
- `lib/schema.ts`: single source of truth for form fields and options. Import from here in both the client form and the server route, do not redefine option lists inline.

## Constraints to respect

- The API route has no auth and an in-memory, per-instance rate limit. Do not present it as production ready without flagging that tradeoff.
- Keep client and server validation on the same Zod schema.
