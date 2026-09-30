// Section headings the system prompt in app/api/assess/route.ts asks the model to produce.
export const ASSESSMENT_SECTIONS = [
  'Migration Complexity',
  'What Moves to Vercel',
  'What Stays in AWS',
  'Target Architecture',
  'IaC Considerations',
  'Compliance Mapping',
  'Performance Wins',
  'Phased Migration Roadmap',
  'Terraform Snippet',
] as const;

export type ComplexityLevel = 'Simple' | 'Moderate' | 'Complex';

export interface AssessmentSummary {
  level: ComplexityLevel | null;
  score: number | null;
  /** Headings found so far, in order. */
  headings: string[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseAssessment(markdown: string): AssessmentSummary {
  const headings = [...markdown.matchAll(/^##\s+(.+?)\s*$/gm)].map(match => match[1]);

  const complexity = markdown.match(/^##\s+Migration Complexity\s*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m)?.[1] ?? '';
  const levelMatch = complexity.match(/\b(Simple|Moderate|Complex)\b/i);
  const scoreMatch = complexity.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);

  const level = levelMatch
    ? ((levelMatch[1][0].toUpperCase() + levelMatch[1].slice(1).toLowerCase()) as ComplexityLevel)
    : null;
  const score = scoreMatch ? Math.min(10, Number(scoreMatch[1])) : null;

  return { level, score, headings };
}
