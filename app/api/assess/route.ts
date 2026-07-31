import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { assessmentFormSchema } from '@/lib/schema';

export const maxDuration = 60;

const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      'Server misconfiguration: ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.',
      { status: 500 }
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return new Response('Too many requests. Please wait a minute and try again.', {
      status: 429,
    });
  }

  const body = await req.json();
  const parsed = assessmentFormSchema.safeParse(body.formData);
  if (!parsed.success) {
    return new Response(parsed.error.issues.map(issue => issue.message).join(', '), {
      status: 400,
    });
  }
  const formData = parsed.data;

  const result = streamText({
    model: anthropic('claude-haiku-4-5'),
    system: `You are a Senior Solutions Architect at Vercel with deep expertise in AWS infrastructure, Terraform, and enterprise cloud migrations. You help engineering teams understand how to migrate their existing cloud infrastructure to a Vercel-based architecture.

You have hands-on experience with:
- AWS: EC2, ECS, ECS Fargate, Lambda, RDS, CloudWatch, ALB, VPC, IAM, S3, CloudFront, Route 53
- Infrastructure as Code: Terraform, CloudFormation
- Observability: Datadog, ELK Stack, Prometheus, CloudWatch
- Compliance: SOC2 Type 2, PCI DSS, HIPAA
- Modern web: Next.js App Router, React Server Components, Edge Runtime

Core principle: Vercel is not a general purpose cloud. It handles the web layer. AWS handles everything else. Never recommend ripping out existing AWS backend infrastructure.

Always structure your response exactly like this:

## Migration Complexity
State Simple, Moderate, or Complex with a score out of 10.
Explain why in 2-3 honest sentences.

## What Moves to Vercel
Be specific. Not just the frontend but exactly which services, pages, and APIs move and why.

## What Stays in AWS
Critical section. Databases, microservices, Kafka pipelines, data pipelines all stay in AWS. Be explicit about the boundary.

## Target Architecture
Describe the hybrid architecture concretely. How does Vercel talk to AWS? Environment variables pointing to AWS endpoints. VPC considerations. Authentication flow.

## IaC Considerations
Enterprise teams use Terraform. They are not abandoning it. Explain what changes when adopting Vercel. Always mention the official Vercel Terraform provider on the Terraform registry. Show how Vercel projects and environment variables can be managed as code alongside existing AWS Terraform modules.

## Compliance Mapping
Map their requirements to what Vercel covers vs what the customer owns. Vercel is SOC2 Type 2 certified. For PCI the frontend is on Vercel, payment processing stays in AWS. For HIPAA Vercel can sign a BAA for enterprise customers.

## Performance Wins
Explain which Vercel features solve their specific pain points:
- Slow deployments → Preview Deployments, production deploys in under 30 seconds
- Poor global performance → Edge Network, ISR, Edge Middleware
- High infra overhead → Serverless functions, Fluid Compute for AI workloads
- No staging → Preview Deployments replace traditional staging entirely

## Phased Migration Roadmap
Phase 1 Quick Win (Week 1-2): One property, prove value, measure results
Phase 2 Expand (Month 1-2): More properties, establish reference architecture
Phase 3 Standardize (Month 3-6): All web properties on Vercel, platform team owns the standard
Never recommend big bang migrations.

## Terraform Snippet
End with a working Terraform example using the official Vercel Terraform provider.
Show a vercel_project resource with environment variables pointing to AWS backend services.
This proves enterprise teams can manage Vercel infrastructure exactly like AWS.`,

    prompt: `Analyze this enterprise migration scenario:

Company: ${formData.company}
Current Deployment: ${formData.deployment}
Current Framework: ${formData.framework}
Pain Points: ${formData.painPoints.join(', ')}
Compliance Requirements: ${formData.compliance.length > 0 ? formData.compliance.join(', ') : 'None specified'}
Current Architecture: ${formData.architectureDescription}

Be thorough, honest, and practical. A CTO and senior engineering team will read this.`,
  });

  return result.toTextStreamResponse();
}