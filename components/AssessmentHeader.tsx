'use client';

import { useState } from 'react';
import { ASSESSMENT_SECTIONS, parseAssessment, slugify, type ComplexityLevel } from '@/lib/assessment';

const LEVEL_STYLES: Record<ComplexityLevel, { text: string; bar: string; ring: string }> = {
  Simple: { text: 'text-emerald-300', bar: 'bg-emerald-400', ring: 'border-emerald-400/30 bg-emerald-500/10' },
  Moderate: { text: 'text-amber-300', bar: 'bg-amber-400', ring: 'border-amber-400/30 bg-amber-500/10' },
  Complex: { text: 'text-rose-300', bar: 'bg-rose-400', ring: 'border-rose-400/30 bg-rose-500/10' },
};

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AssessmentHeader({
  company,
  markdown,
  loading,
}: {
  company: string;
  markdown: string;
  loading: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { level, score, headings } = parseAssessment(markdown);
  const found = ASSESSMENT_SECTIONS.filter(title => headings.includes(title)).length;
  const progress = loading ? Math.round((found / ASSESSMENT_SECTIONS.length) * 100) : 100;
  const styles = level ? LEVEL_STYLES[level] : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the download button still works.
    }
  };

  const buttonClass =
    'min-h-11 rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-gray-200 transition-colors hover:border-white/25 hover:text-white';

  return (
    <div className="mb-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Migration assessment
          </p>
          <h2 className="mt-1 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {company}
          </h2>
        </div>

        {styles && level && (
          <div className={`rounded-xl border px-4 py-3 sm:min-w-44 ${styles.ring}`}>
            <p className="text-xs text-gray-300">Migration complexity</p>
            <p className={`text-xl font-bold ${styles.text}`}>
              {level}
              {score !== null && <span className="ml-2 text-base font-semibold">{score}/10</span>}
            </p>
            {score !== null && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${score * 10}%` }} />
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div
          role="progressbar"
          aria-label="Assessment progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-1 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-violet-400 to-cyan-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <nav aria-label="Assessment sections" className="mt-4 flex flex-wrap gap-2">
          {ASSESSMENT_SECTIONS.map(title => {
            const ready = headings.includes(title);
            return ready ? (
              <a
                key={title}
                href={`#${slugify(title)}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 transition-colors hover:border-violet-400/60 hover:text-white"
              >
                {title}
              </a>
            ) : (
              <span
                key={title}
                className="rounded-full border border-dashed border-white/10 px-3 py-1.5 text-xs text-gray-500"
              >
                {title}
              </span>
            );
          })}
        </nav>
      </div>

      {!loading && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copy} className={buttonClass}>
            {copied ? 'Copied' : 'Copy as Markdown'}
          </button>
          <button
            type="button"
            onClick={() => download(`${slugify(company) || 'migration'}-assessment.md`, markdown)}
            className={buttonClass}
          >
            Download .md
          </button>
        </div>
      )}
    </div>
  );
}
