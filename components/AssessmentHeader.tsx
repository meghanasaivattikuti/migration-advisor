'use client';

import { useEffect, useState } from 'react';
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
  const [elapsed, setElapsed] = useState(0);
  const { level, score, headings } = parseAssessment(markdown);
  const seen = ASSESSMENT_SECTIONS.filter(title => headings.includes(title));
  const found = seen.length;
  const active = loading && found > 0 ? seen[found - 1] : null;

  useEffect(() => {
    if (!loading) return;
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [loading]);
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
        <p className="mb-3 flex items-center gap-2 text-sm text-gray-200">
          {loading && (
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
          )}
          <span>
            {loading
              ? found === 0
                ? 'Connecting to Claude and reading your inputs...'
                : `Writing section ${found} of ${ASSESSMENT_SECTIONS.length}: ${active}`
              : `Finished in ${elapsed}s`}
          </span>
          {loading && <span className="text-gray-400">&middot; {elapsed}s</span>}
        </p>
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
            const isActive = title === active;
            return ready ? (
              <a
                key={title}
                href={`#${slugify(title)}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-gray-100 transition-colors hover:text-white ${
                  isActive
                    ? 'border-violet-400/70 bg-violet-500/15'
                    : 'border-white/10 bg-white/5 hover:border-violet-400/60'
                }`}
              >
                {isActive ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300" />
                ) : (
                  <span aria-hidden className="text-emerald-400">&#10003;</span>
                )}
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
