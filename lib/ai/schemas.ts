import { z } from "zod";
import { RISK_CATEGORIES, RISK_LEVELS } from "@/lib/constants";

export const SeveritySchema = z.enum(RISK_LEVELS);
export const RiskCategorySchema = z.enum(RISK_CATEGORIES);

export const FullRiskReportSchema = z
  .object({
    document_metadata: z
      .object({
        company_name: z.string(),
        document_type: z.string(),
        effective_date: z.string(),
        jurisdiction: z.string(),
        audience: z.string(),
        confidence: z.number().min(0).max(1)
      })
      .strict(),
    overall_assessment: z
      .object({
        overall_score: z.number().min(0).max(10),
        overall_severity: SeveritySchema,
        summary: z.string(),
        top_risks: z.array(z.string()),
        safe_use_recommendation: z.string()
      })
      .strict(),
    category_scores: z.array(
      z
        .object({
          category: RiskCategorySchema,
          score: z.number().min(0).max(10),
          severity: SeveritySchema,
          confidence: z.number().min(0).max(1),
          evidence: z.array(z.string()).min(1),
          analysis: z.string(),
          user_impact: z.string(),
          mitigation: z.string()
        })
        .strict()
    ),
    red_flags: z.array(
      z
        .object({
          title: z.string(),
          severity: SeveritySchema,
          evidence: z.string(),
          why_it_matters: z.string(),
          recommended_action: z.string()
        })
        .strict()
    ),
    missing_or_unclear_terms: z.array(
      z
        .object({
          topic: z.string(),
          risk: z.string(),
          why_it_matters: z.string()
        })
        .strict()
    ),
    plain_english_summary: z.string(),
    recommended_questions_to_ask_company: z.array(z.string())
  })
  .strict();

export const PolicyChangeAnalysisSchema = z
  .object({
    meaningful_change_detected: z.boolean(),
    overall_risk_impact_score: z.number().min(0).max(10),
    overall_risk_impact_level: SeveritySchema,
    summary: z.string(),
    findings: z.array(
      z
        .object({
          category: RiskCategorySchema,
          severity: SeveritySchema,
          confidence: z.number().min(0).max(1),
          title: z.string(),
          what_changed: z.string(),
          old_text: z.string(),
          new_text: z.string(),
          why_it_matters: z.string(),
          user_impact: z.string()
        })
        .strict()
    ),
    non_substantive_changes: z.array(z.string())
  })
  .strict();

export type FullRiskReport = z.infer<typeof FullRiskReportSchema>;
export type PolicyChangeAnalysis = z.infer<typeof PolicyChangeAnalysisSchema>;
