import { z } from 'zod';

export const deploymentOptions = [
  'AWS EC2',
  'AWS ECS/Fargate',
  'AWS Lambda',
  'AWS Amplify',
  'Self-hosted servers',
  'Heroku',
  'Other',
] as const;

export const frameworkOptions = [
  'React SPA',
  'Next.js Pages Router',
  'Vue/Nuxt',
  'Angular',
  'Plain HTML/JS',
  'Other',
] as const;

export const painPointOptions = [
  'Slow deployments',
  'No preview environments',
  'Poor global performance',
  'High infrastructure cost',
  'Complex IaC management',
  'Poor developer experience',
  'Scaling challenges',
] as const;

export const complianceOptions = ['SOC2', 'PCI DSS', 'HIPAA', 'None'] as const;

export const assessmentFormSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(200, 'Company name is too long'),
  deployment: z.enum(deploymentOptions, {
    message: 'Select a current deployment platform',
  }),
  framework: z.enum(frameworkOptions, {
    message: 'Select a current framework',
  }),
  painPoints: z.array(z.enum(painPointOptions)).default([]),
  compliance: z.array(z.enum(complianceOptions)).default([]),
  architectureDescription: z
    .string()
    .trim()
    .max(4000, 'Architecture description is too long')
    .default(''),
});

export type AssessmentFormData = z.infer<typeof assessmentFormSchema>;
