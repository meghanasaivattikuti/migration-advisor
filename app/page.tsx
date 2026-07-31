'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  assessmentFormSchema,
  complianceOptions,
  deploymentOptions,
  frameworkOptions,
  painPointOptions,
} from '@/lib/schema';

const markdownComponents: ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-2xl font-bold text-white first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 border-b border-white/10 pb-2 text-xl font-bold text-white first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-lg font-semibold text-white first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-3 leading-relaxed text-gray-300">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1 text-gray-300">{children}</ul>,
  ol: ({ children, start }) => (
    <ol start={start} className="mb-3 ml-5 list-decimal space-y-1 text-gray-300">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-violet-400 underline hover:text-violet-300">
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-emerald-300">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg border border-white/10 bg-black/60 px-4 py-3 font-mono text-sm text-emerald-400">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/10 px-3 py-2 font-semibold text-white">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/5 px-3 py-2 text-gray-300">{children}</td>
  ),
};

interface DraftFormData {
  company: string;
  deployment: string;
  framework: string;
  painPoints: string[];
  compliance: string[];
  architectureDescription: string;
}

const EMPTY_FORM: DraftFormData = {
  company: '',
  deployment: '',
  framework: '',
  painPoints: [],
  compliance: [],
  architectureDescription: '',
};

const STEPS = [
  { label: 'Describe', detail: 'your current AWS stack' },
  { label: 'Analyze', detail: 'against the Vercel model' },
  { label: 'Migrate', detail: 'with a phased roadmap' },
];

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
        active
          ? 'border-violet-400/60 bg-violet-500/10 text-white'
          : 'border-white/10 bg-black/20 text-gray-400 hover:border-white/20 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function FormCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-6 backdrop-blur-sm">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  const [formData, setFormData] = useState<DraftFormData>(EMPTY_FORM);
  const [assessment, setAssessment] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [formError, setFormError] = useState('');

  const toggleCheckbox = (field: 'painPoints' | 'compliance', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async () => {
    const parsed = assessmentFormSchema.safeParse(formData);
    if (!parsed.success) {
      setFormError(parsed.error.issues.map(issue => issue.message).join(', '));
      return;
    }
    setFormError('');

    setLoading(true);
    setStarted(true);
    setAssessment('');

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: parsed.data }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setAssessment('Error: ' + errorText);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setAssessment('Error: No response stream');
        return;
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAssessment(prev => prev + chunk);
      }

    } catch (error) {
      console.error(error);
      setAssessment('Something went wrong. Check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setAssessment('');
    setStarted(false);
    setFormError('');
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-violet-500 to-cyan-400 opacity-30 blur-md" />
              <div
                className="relative h-5 w-5 bg-white"
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Migration Readiness Advisor</h1>
              <p className="text-xs text-gray-500">Enterprise AWS to Vercel assessments</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Powered by Claude
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-linear-to-r from-violet-600/30 via-fuchsia-500/20 to-cyan-400/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-6 pb-10 pt-16 text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
            Solutions Architect, automated
          </span>
          <h2 className="bg-linear-to-b from-white to-gray-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Know exactly what moves to Vercel
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-gray-400 sm:text-base">
            Describe your current AWS setup and get a hybrid migration architecture, IaC guidance,
            and a phased rollout plan back in seconds.
          </p>

          <div className="mx-auto mt-8 flex max-w-lg items-center justify-center gap-2 text-xs text-gray-500">
            {STEPS.map((step, idx) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <span className="font-semibold text-gray-300">{idx + 1}.</span>
                  <span className="text-gray-300">{step.label}</span>
                  <span className="hidden text-gray-600 sm:inline">{step.detail}</span>
                </div>
                {idx < STEPS.length - 1 && <span className="text-gray-700">&rarr;</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-6 px-6 pb-24">
        <FormCard title="Your stack" subtitle="The basics of what you are running today.">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="company" className="mb-2 block text-sm font-medium text-gray-300">
                Company Name
              </label>
              <input
                id="company"
                type="text"
                placeholder="e.g. Acme Corp"
                value={formData.company}
                onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-600 transition-colors focus:border-violet-400/60 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="deployment" className="mb-2 block text-sm font-medium text-gray-300">
                Deployment Platform
              </label>
              <select
                id="deployment"
                value={formData.deployment}
                onChange={e => setFormData(prev => ({ ...prev, deployment: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white transition-colors focus:border-violet-400/60 focus:outline-none"
              >
                <option value="">Select platform...</option>
                {deploymentOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="framework" className="mb-2 block text-sm font-medium text-gray-300">
                Framework
              </label>
              <select
                id="framework"
                value={formData.framework}
                onChange={e => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white transition-colors focus:border-violet-400/60 focus:outline-none"
              >
                <option value="">Select framework...</option>
                {frameworkOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </FormCard>

        <FormCard title="Pain points" subtitle="Select anything that is currently costing you time or money.">
          <div className="grid grid-cols-2 gap-2">
            {painPointOptions.map(opt => (
              <ToggleChip
                key={opt}
                label={opt}
                active={formData.painPoints.includes(opt)}
                onClick={() => toggleCheckbox('painPoints', opt)}
              />
            ))}
          </div>
        </FormCard>

        <FormCard title="Compliance requirements" subtitle="What your org needs Vercel and AWS to jointly cover.">
          <div className="grid grid-cols-2 gap-2">
            {complianceOptions.map(opt => (
              <ToggleChip
                key={opt}
                label={opt}
                active={formData.compliance.includes(opt)}
                onClick={() => toggleCheckbox('compliance', opt)}
              />
            ))}
          </div>
        </FormCard>

        <FormCard title="Architecture" subtitle="The more specific, the sharper the assessment.">
          <textarea
            id="architectureDescription"
            aria-label="Describe your current architecture"
            rows={5}
            placeholder="e.g. We run a React SPA on EC2 behind an ALB, PostgreSQL on RDS, Redis on ElastiCache, all provisioned with Terraform. Our deployment pipeline takes 45 minutes and we have no way for designers to preview changes before production."
            value={formData.architectureDescription}
            onChange={e => setFormData(prev => ({ ...prev, architectureDescription: e.target.value }))}
            className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-600 transition-colors focus:border-violet-400/60 focus:outline-none"
          />
        </FormCard>

        {formError && (
          <p className="text-sm text-red-400">{formError}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-white py-4 font-semibold text-black transition-all hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
        >
          <span className="inline-flex items-center gap-2">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Generating assessment...
              </>
            ) : (
              <>
                Generate assessment
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </>
            )}
          </span>
        </button>

        {started && (
          <div className="animate-fade-in rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'}`}
                />
                <span className="text-sm text-gray-400">
                  {loading ? 'Claude is analyzing your architecture...' : 'Assessment complete'}
                </span>
              </div>
              {!loading && assessment && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-gray-500 transition-colors hover:text-white"
                >
                  New assessment
                </button>
              )}
            </div>
            <div>
              {assessment ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {assessment}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-gray-500">Waiting for response...</p>
              )}
              {loading && (
                <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-white" />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
