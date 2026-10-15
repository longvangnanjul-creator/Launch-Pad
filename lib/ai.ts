import OpenAI from 'openai';
import { questionerPrompt, customerAnalysisPrompt } from './prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QuestionTurn {
  turn_index: number;
  question_text: string;
  answer_text: string;
}

export interface EvidenceItem {
  id: string;
  stage: string;
  url?: string;
  quote_or_note: string;
  source_label: string;
}

export interface StageFindings {
  findings: Array<{
    kind: 'evidence' | 'interpretation' | 'no_evidence';
    text: string;
    evidenceItemIds?: string[];
  }>;
  summary?: string;
  [key: string]: unknown;
}

async function callAI(systemPrompt: string, userMessage: string, maxTokens = 2000): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  });

  return response.choices[0]?.message?.content || '{}';
}

export async function generateNextQuestion(
  project: { title: string; description: string; asset_type: string },
  questions: QuestionTurn[],
): Promise<string | null> {
  // If no OpenAI key, use fallback questions
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'REPLACE_WITH_YOUR_OPENAI_API_KEY') {
    const fallbacks = [
      `What specific problem does "${project.title}" solve for your customers?`,
      `Who is your ideal customer for "${project.title}"? Describe them in detail.`,
      `What makes "${project.title}" different from existing solutions?`,
      `How do you plan to make money with "${project.title}"?`,
      `What are the biggest challenges you expect to face?`,
      `What skills or resources do you already have?`,
      `How will you find your first customers?`,
      `What would success look like in 6 months?`,
    ];
    const idx = questions.length;
    return idx < fallbacks.length ? fallbacks[idx] : null;
  }

  try {
    const userMessage = JSON.stringify({
      project,
      previousQuestions: questions,
      questionCount: questions.length,
    });

    const raw = await callAI(questionerPrompt, userMessage, 500);
    const parsed = JSON.parse(raw) as { question?: string; complete?: boolean };

    if (parsed.complete || !parsed.question) return null;
    return parsed.question;
  } catch (error) {
    console.error('AI question generation failed, using fallback:', error);
    const fallbacks = [
      `What specific problem does "${project.title}" solve for your customers?`,
      `Who is your ideal customer for "${project.title}"? Describe them in detail.`,
      `What makes "${project.title}" different from existing solutions?`,
      `How do you plan to make money with "${project.title}"?`,
      `What are the biggest challenges you expect to face?`,
      `What skills or resources do you already have?`,
      `How will you find your first customers?`,
      `What would success look like in 6 months?`,
    ];
    const idx = questions.length;
    return idx < fallbacks.length ? fallbacks[idx] : null;
  }
}

export async function runCustomerAnalysis(
  project: { title: string; description: string; asset_type: string },
  questions: QuestionTurn[],
  evidenceItems: EvidenceItem[],
): Promise<StageFindings> {
  try {
    const userMessage = JSON.stringify({ project, questionTurns: questions, evidenceItems });
    const raw = await callAI(customerAnalysisPrompt, userMessage, 2000);
    return JSON.parse(raw) as StageFindings;
  } catch (error) {
    console.error('AI customer analysis failed:', error);
    return {
      findings: [{ kind: 'no_evidence', text: 'Analysis failed. Please try again.', evidenceItemIds: [] }],
      summary: 'Analysis could not be completed.',
    };
  }
}

export const stagePrompts: Record<string, string> = {
  problem: `You are a problem analyst. Identify and analyze customer problems based on user input and evidence.
Rules: Never invent problems. Label every finding as evidence, interpretation, or no_evidence. Evidence findings must reference an evidence item ID. Frequency and severity are interpretations unless evidence exists.
Return JSON only: { "problems": [{ "description", "frequency", "severity", "existingSolutions", "solutionWeaknesses", "evidenceItemIds": [] }], "findings": [{ "kind", "text", "evidenceItemIds": [] }], "summary" }`,

  demand: `You are a market demand analyst. Assess whether there is evidence of demand.
Rules: Never invent data. No search volumes, market sizes, or statistics unless provided as evidence. Label every finding. If no evidence exists, return no_evidence findings and frame interpretations as hypotheses.
Return JSON only: { "findings": [{ "kind", "text", "evidenceItemIds": [] }], "summary" }`,

  competitors: `You are a competitive analyst. Identify and analyze competitors based on user input and evidence.
Rules: Never invent competitor names or pricing. Label every findings. Empty cells are valid. An incomplete table is better than a fabricated one.
Return JSON only: { "competitors": [{ "name", "productService", "targetCustomer", "pricing", "strengths", "weaknesses", "evidenceItemIds": [] }], "findings": [{ "kind", "text", "evidenceItemIds": [] }], "summary" }`,

  gaps: `You are a market gap analyst. Identify gaps based on user input and evidence.
Rules: Never invent gaps. Label every finding. Gaps are interpretations unless evidence exists.
Return JSON only: { "gaps": [{ "type": "product|service|price|convenience|quality|accessibility|geographic|experience", "description", "evidenceItemIds": [] }], "findings": [{ "kind", "text", "gapType", "evidenceItemIds": [] }], "summary" }`,

  opportunities: `You are an opportunity discovery analyst. Generate 1-3 potential business opportunities based on gaps and problems identified.
Rules: Never say "this is the best idea." Label every finding. Opportunities are interpretations, not proven facts. Base opportunities on identified gaps.
Return JSON only: { "opportunities": [{ "name", "customer", "problem", "proposedSolution", "whyItExists", "alternatives", "differentiation", "requiredSkills", "businessModel", "risks", "validationSteps" }], "findings": [{ "kind": "interpretation", "text", "evidenceItemIds": [] }], "summary" }`,

  validation: `You are a validation analyst. Score each opportunity across key factors to help the user make an informed decision.
Rules: Never invent data. Every score must be justified. Evidence strength is honest. This is a scorecard, not a recommendation.
Return JSON only: { "scorecards": [{ "opportunityId", "demandEvidence", "demandEvidenceKind", "problemSeverity": "high|medium|low", "competition": "high|medium|low", "marketGap", "marketGapKind", "monetization", "skills", "mainRisks", "evidenceStrength": "strong|moderate|limited" }], "findings": [{ "kind", "text", "evidenceItemIds": [] }], "summary" }`,

  report: `You are a market research report writer. Compile all findings, opportunities, and validation results into a structured, actionable report.
Rules: Preserve evidence labels. Never invent data. Be honest about gaps. The report is a snapshot.
Return JSON only: { "sections": [{ "number": 1, "title": "Executive Summary", "content", "findings": [] }], "actionPlan": [{ "step", "detail", "timeframe" }] }
The report must have exactly 13 sections: 1. Executive Summary, 2. Market, 3. Target Customer, 4. Customer Problems, 5. Demand, 6. Competitors, 7. Market Gaps, 8. Opportunities, 9. Required Skills, 10. Business Models, 11. Risks, 12. Validation Plan, 13. Action Plan.
Action plan must have 5-10 concrete steps with timeframes (Days 1-3, Days 4-7, Days 8-14).`,
};

function getFallbackStageResult(stage: string, project: { title: string; description: string }, questions: QuestionTurn[]): StageFindings {
  const answerSummary = questions.map(q => q.answer_text).join('. ');
  const baseFindings: StageFindings['findings'] = [
    { kind: 'interpretation', text: `Based on your description: "${project.description}". ${answerSummary ? `Your answers suggest: ${answerSummary.slice(0, 200)}` : ''}`, evidenceItemIds: [] },
    { kind: 'no_evidence', text: 'No external evidence was provided. Add evidence items to strengthen this analysis.', evidenceItemIds: [] },
  ];

  const summaries: Record<string, string> = {
    customer: `Customer analysis based on ${questions.length} question responses. Your target customer details are derived from your answers.`,
    problem: `Problem analysis identified from your business description and interview responses.`,
    demand: `Demand analysis based on available information. No external demand evidence was provided.`,
    competitors: `No competitor information was provided. Add evidence about competitors to generate a detailed analysis.`,
    gaps: `Market gap analysis based on your answers. No external evidence was provided.`,
    opportunities: `Opportunities identified from your business description and analysis.`,
    validation: `Validation scorecard based on available information.`,
  };

  // For opportunities stage, also return opportunities array for fallback
  if (stage === 'opportunities') {
    return {
      findings: baseFindings,
      summary: summaries[stage],
      opportunities: [
        {
          name: `${project.title} - Core Offering`,
          customer: 'Target customers identified from your interview responses',
          problem: 'The primary problem your business solves based on your description',
          proposedSolution: project.description,
          whyItExists: 'Based on the problems and gaps identified in previous analysis stages',
          alternatives: 'Existing alternatives customers currently use',
          differentiation: 'Your unique approach as described in your interview',
          requiredSkills: 'Skills needed to deliver your solution',
          businessModel: 'Revenue model based on your offer',
          risks: 'Key risks based on competition and market conditions',
          validationSteps: 'Customer interviews, prototype testing, and feedback collection',
        },
      ],
    };
  }

  return {
    findings: baseFindings,
    summary: summaries[stage] || `${stage} analysis completed.`,
  };
}

export async function runStageAnalysis(
  stage: string,
  project: { title: string; description: string; asset_type: string },
  questions: QuestionTurn[],
  evidenceItems: EvidenceItem[],
  previousFindings: StageFindings[] = [],
  opportunities: Array<{ id: string; name: string }> = [],
): Promise<StageFindings> {
  const prompt = stagePrompts[stage];
  if (!prompt) {
    return {
      findings: [{ kind: 'no_evidence', text: `Unknown stage: ${stage}`, evidenceItemIds: [] }],
    };
  }

  // If no OpenAI key, use fallback
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'REPLACE_WITH_YOUR_OPENAI_API_KEY') {
    return getFallbackStageResult(stage, project, questions);
  }

  try {
    const userMessage = JSON.stringify({
      project,
      questionTurns: questions,
      evidenceItems,
      previousFindings,
      opportunities,
    });

    const raw = await callAI(prompt, userMessage, 2000);
    return JSON.parse(raw) as StageFindings;
  } catch (error) {
    console.error(`AI ${stage} analysis failed, using fallback:`, error);
    return getFallbackStageResult(stage, project, questions);
  }
}
