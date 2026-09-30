'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, type ReactNode } from 'react';
import {
  assessmentFormSchema,
  complianceOptions,
  deploymentOptions,
  frameworkOptions,
  painPointOptions,
} from '@/lib/schema';

import AssessmentHeader from '@/components/AssessmentHeader';

const EXAMPLE_FORM: DraftFormData = {
  company: 'Acme Corp',
  deployment: 'AWS ECS/Fargate',
  framework: 'React SPA',
  painPoints: ['Slow deployments', 'No preview environments', 'Poor global performance'],
  compliance: ['SOC2', 'PCI DSS'],
  architectureDescription:
    'React SPA served from ECS behind an ALB. Node API on Fargate, PostgreSQL on RDS, Kafka for order events, all provisioned with Terraform. Deploys take about 45 minutes and designers cannot preview changes before production. Payments are handled by a third-party gateway.',
};

const GENERIC_ERROR =
  'Something went wrong generating your assessment. Please try again in a moment.';

const AssessmentResults = dynamic(() => import('@/components/AssessmentResults'), {
  loading: () => <p className="text-sm text-gray-400">Loading...</p>,
});

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
      className={`flex min-h-12 items-center gap-2.5 rounded-lg border px-3 py-3 text-left text-sm transition-colors sm:px-4 ${
        active
          ? 'border-violet-400/70 bg-violet-500/15 text-white'
          : 'border-white/10 bg-black/20 text-gray-300 hover:border-white/25 hover:text-white'
      }`}
    >
      <span
        aria-hidden
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none ${
          active ? 'border-violet-400 bg-violet-400 text-black' : 'border-white/30'
        }`}
      >
        {active ? '\u2713' : ''}
      </span>
      <span className="min-w-0 break-words">{label}</span>
    </button>
  );
}

function FormCard({
  title,
  subtitle,
  children,
  asFieldset = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  asFieldset?: boolean;
}) {
  const header = (
    <>
      {asFieldset ? (
        <legend className="text-base font-semibold text-white">{title}</legend>
      ) : (
        <h3 className="text-base font-semibold text-white">{title}</h3>
      )}
      <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
    </>
  );
  const className =
    'rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-6 backdrop-blur-sm';
  if (asFieldset) {
    return (
      <fieldset className={className}>
        <div>{header}</div>
        {children}
      </fieldset>
    );
  }
  return (
    <div className={className}>
      <div>{header}</div>
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
  const [requestError, setRequestError] = useState('');
  const [runId, setRunId] = useState(0);
  const [submittedCompany, setSubmittedCompany] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

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
    setSubmittedCompany(parsed.data.company);

    setLoading(true);
    setStarted(true);
    setAssessment('');
    setRequestError('');
    setRunId(id => id + 1);
    // Results render below the button; on phones nothing visible changes without this.
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: parsed.data }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Assessment request failed:', response.status, errorText);
        // 4xx messages are written for end users (validation, rate limit); 5xx are generic.
        setRequestError(response.status < 500 && errorText ? errorText : GENERIC_ERROR);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setRequestError(GENERIC_ERROR);
        return;
      }

      const decoder = new TextDecoder();
      let received = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        received += chunk;
        setAssessment(prev => prev + chunk);
      }
      if (!received.trim()) setRequestError(GENERIC_ERROR);

    } catch (error) {
      console.error(error);
      setRequestError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setAssessment('');
    setRequestError('');
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
              <p className="text-xs text-gray-400">Enterprise AWS to Vercel assessments</p>
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
            and a phased rollout plan back in about a minute.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-gray-400">
            {STEPS.map((step, idx) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <span className="font-semibold text-gray-300">{idx + 1}.</span>
                  <span className="text-gray-300">{step.label}</span>
                  <span className="hidden text-gray-500 sm:inline">{step.detail}</span>
                </div>
                {idx < STEPS.length - 1 && <span className="text-gray-700">&rarr;</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16 sm:px-6">
        <div className="flex flex-col gap-3 rounded-xl border border-violet-400/20 bg-violet-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-300">Presenting this? Load a realistic scenario in one click.</p>
          <button
            type="button"
            onClick={() => {
              setFormData(EXAMPLE_FORM);
              setFormError('');
            }}
            disabled={loading}
            className="min-h-11 rounded-lg border border-violet-400/40 bg-violet-500/15 px-4 text-sm font-medium text-white transition-colors hover:bg-violet-500/25 disabled:opacity-50"
          >
            Try an example
          </button>
        </div>

        <FormCard title="Your stack" subtitle="The basics of what you are running today.">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="company" className="mb-2 block text-sm font-medium text-gray-200">
                Company Name
              </label>
              <input
                id="company"
                type="text"
                placeholder="e.g. Acme Corp"
                value={formData.company}
                onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
              />
            </div>

            <div>
              <label htmlFor="deployment" className="mb-2 block text-sm font-medium text-gray-200">
                Deployment Platform
              </label>
              <select
                id="deployment"
                value={formData.deployment}
                onChange={e => setFormData(prev => ({ ...prev, deployment: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white transition-colors focus:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
              >
                <option value="">Select platform...</option>
                {deploymentOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="framework" className="mb-2 block text-sm font-medium text-gray-200">
                Framework
              </label>
              <select
                id="framework"
                value={formData.framework}
                onChange={e => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white transition-colors focus:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
              >
                <option value="">Select framework...</option>
                {frameworkOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </FormCard>

        <FormCard asFieldset title="Pain points" subtitle="Select anything that is currently costing you time or money.">
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
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

        <FormCard asFieldset title="Compliance requirements" subtitle="What your org needs Vercel and AWS to jointly cover.">
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
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
            rows={6}
            placeholder="e.g. We run a React SPA on EC2 behind an ALB, PostgreSQL on RDS, Redis on ElastiCache, all provisioned with Terraform. Our deployment pipeline takes 45 minutes and we have no way for designers to preview changes before production."
            value={formData.architectureDescription}
            onChange={e => setFormData(prev => ({ ...prev, architectureDescription: e.target.value }))}
            className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          />
        </FormCard>

        {formError && (
          <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{formError}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-white py-4 text-base font-semibold text-black transition-all hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
        >
          <span className="inline-flex items-center justify-center gap-2">
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
          <div ref={resultsRef} className="animate-fade-in scroll-mt-20 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-10">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    loading ? 'animate-pulse bg-amber-400' : requestError ? 'bg-red-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="text-sm text-gray-300" role="status">
                  {loading
                    ? 'Claude is analyzing your architecture...'
                    : requestError
                      ? 'Assessment failed'
                      : 'Assessment complete'}
                </span>
              </div>
              {!loading && (assessment || requestError) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-11 rounded-lg px-3 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  New assessment
                </button>
              )}
            </div>
            {requestError && (
              <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-200">{requestError}</p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="mt-3 min-h-11 rounded-lg border border-white/15 bg-white/10 px-4 text-sm text-white hover:bg-white/15"
                >
                  Try again
                </button>
              </div>
            )}
            {(assessment || loading) && !requestError && (
              <AssessmentHeader
                key={runId}
                company={submittedCompany}
                markdown={assessment}
                loading={loading}
              />
            )}
            <div aria-busy={loading}>
              {requestError ? null : assessment ? (
                <AssessmentResults markdown={assessment} />
              ) : null}
              {loading && (
                <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-white" />
              )}
            </div>
          </div>
        )}
      </div>
      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs leading-5 text-gray-400">
        <p className="mx-auto max-w-2xl">
          Assessments are AI-generated guidance, not a contractual commitment. Verify compliance,
          pricing, and plan eligibility with Vercel and your own security team before making decisions.
        </p>
        <p className="mt-2 text-gray-500">Build {process.env.NEXT_PUBLIC_BUILD_ID}</p>
      </footer>
    </main>
  );
}
