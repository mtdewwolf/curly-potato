import OpenAI from "openai";
import { z } from "zod";

import {
  changeAnalysisPrompt,
  buildFullRiskReportPrompt,
  repairJsonPrompt,
} from "@/lib/ai/prompts";
import {
  aiPolicyChangeAnalysisSchema,
  aiRiskReportSchema,
  type AiPolicyChangeAnalysis,
  type AiRiskReport,
} from "@/lib/ai/schemas";

type ValidatedResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; raw?: string };

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function parseJson(raw: string): unknown {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(withoutFence);
}

async function completeJson(prompt: string) {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Return valid JSON only. Ground every finding in supplied evidence. Never invent facts.",
      },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0]?.message.content ?? "";
}

async function validateWithRepair<T>(
  raw: string,
  schema: z.ZodSchema<T>,
): Promise<ValidatedResult<T>> {
  try {
    return { ok: true, data: schema.parse(parseJson(raw)) };
  } catch (error) {
    const repairedRaw = await completeJson(repairJsonPrompt(raw, String(error)));
    try {
      return { ok: true, data: schema.parse(parseJson(repairedRaw)) };
    } catch (repairError) {
      return {
        ok: false,
        error: `AI output failed validation after repair: ${String(repairError)}`,
        raw: repairedRaw || raw,
      };
    }
  }
}

export async function generateRiskReportAnalysis(input: {
  companyName: string;
  documentType: string;
  policyText: string;
}): Promise<ValidatedResult<AiRiskReport>> {
  const raw = await completeJson(
    buildFullRiskReportPrompt({
      companyName: input.companyName,
      documentType: input.documentType,
      policyText: input.policyText,
    }),
  );

  return validateWithRepair(raw, aiRiskReportSchema);
}

export const generateRiskReport = generateRiskReportAnalysis;

export async function analyzePolicyChange(input: {
  companyName: string;
  documentType: string;
  oldText: string;
  newText: string;
  diffText: string;
}): Promise<ValidatedResult<AiPolicyChangeAnalysis>> {
  const raw = await completeJson(
    changeAnalysisPrompt({
      companyName: input.companyName,
      documentType: input.documentType,
      oldText: input.oldText,
      newText: input.newText,
      diffText: input.diffText,
    }),
  );

  return validateWithRepair(raw, aiPolicyChangeAnalysisSchema);
}
