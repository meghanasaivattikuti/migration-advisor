'use client';

import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { slugify } from '@/lib/assessment';

const markdownComponents: ComponentProps<typeof ReactMarkdown>['components'] = {
  // The page header already shows the company name, so the model's own title is dropped.
  h1: () => null,
  h2: ({ children }) => (
    <h2
      id={slugify(String(children))}
      className="scroll-mt-24 mb-4 mt-12 flex items-center gap-3 border-t border-white/10 pt-8 text-xl font-bold tracking-tight text-white first:mt-0 first:border-t-0 first:pt-0 sm:text-2xl"
    >
      <span aria-hidden className="h-6 w-1 shrink-0 rounded-full bg-linear-to-b from-violet-400 to-cyan-400" />
      <span className="min-w-0 break-words">{children}</span>
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-8 text-lg font-semibold text-white">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-6 text-base font-semibold text-gray-100">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-4 break-words text-base leading-7 text-gray-200">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="text-gray-100">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-4 ml-5 list-disc space-y-2 text-gray-200 marker:text-violet-400">{children}</ul>
  ),
  ol: ({ children, start }) => (
    <ol start={start} className="mb-4 ml-5 list-decimal space-y-2 text-gray-200 marker:text-violet-400">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="break-words pl-1 text-base leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-4 rounded-r-lg border-l-4 border-violet-400/60 bg-violet-500/5 px-4 py-3 text-gray-200">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-white/10" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-all text-violet-300 underline underline-offset-2 hover:text-violet-200"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="break-words rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-emerald-300">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-5 overflow-x-auto rounded-xl border border-white/10 bg-black/70 p-4 font-mono text-[13px] leading-6 text-emerald-300">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-5 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-white/10 px-4 py-3 font-semibold text-white">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/5 px-4 py-3 align-top leading-6 text-gray-200">{children}</td>
  ),
};

export default function AssessmentResults({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {markdown}
    </ReactMarkdown>
  );
}
