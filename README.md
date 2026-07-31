# Migration Readiness Advisor

An AI-powered tool that assesses an enterprise's current AWS infrastructure and generates a phased Vercel migration architecture .

A prospect describes their current deployment platform, framework, pain points, and compliance requirements. The tool returns a structured assessment: migration complexity, exactly what moves to Vercel vs. what stays in AWS, the target hybrid architecture, Terraform/IaC guidance, a compliance mapping (SOC2 / PCI DSS / HIPAA), and a phased rollout plan.

## Why this exists

 Enterprise teams evaluating Vercel need to know precisely where the boundary sits before they'll commit, and they need to see IaC, compliance, and migration-risk answered concretely, not in marketing language. 

## How it works

- `app/page.tsx` is a form collecting company, current deployment platform, framework, pain points, and compliance requirements, with results streamed and rendered as formatted markdown.
- `app/api/assess/route.ts` is a Next.js Route Handler that validates the submitted form with a shared [Zod](lib/schema.ts) schema, applies a simple per-IP rate limit, and streams a completion from Claude (via the [Vercel AI SDK](https://ai-sdk.dev)) using a system prompt that pins the model to a response structure.
- `lib/schema.ts` is the single source of truth for form fields and options, shared by both the client form and the server-side validation.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and fill out the form to generate an assessment.

## Notes on scope

This is a demo/portfolio project, not a production service:
- Rate limiting is in-memory and per-instance which isu fine for a single dev/demo deployment, not for a multi-instance serverless production deployment (that would need something like Vercel KV or Upstash).
- There's no auth in front of `/api/assess`; anyone with the URL can generate assessments against your API key.
