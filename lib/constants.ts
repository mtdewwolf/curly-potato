export const riskLevels = ["Low", "Moderate", "Elevated", "High", "Critical"] as const;
export const RISK_LEVELS = riskLevels;

export type RiskLevel = (typeof riskLevels)[number];

export const categories = [
  "AI Tools",
  "Social Media",
  "Messaging",
  "Payments",
  "E-Commerce",
  "Gaming",
  "Cloud Services",
  "Productivity",
  "Delivery",
  "Streaming",
  "Education",
  "Kids/Family",
  "Finance",
  "Healthcare",
  "Developer Tools",
  "Government",
  "Other",
] as const;
export const CATEGORIES = categories;
export const SERVICE_CATEGORIES = categories;

export const documentTypes = [
  "Terms of Service",
  "Privacy Policy",
  "Cookie Policy",
  "AI/Data Policy",
  "Developer Terms",
  "Business Terms",
  "Data Processing Addendum",
  "Community Guidelines",
  "Acceptable Use Policy",
  "Children/Family Policy",
  "Security Policy",
  "Other",
] as const;
export const DOCUMENT_TYPES = documentTypes;
export const SCAN_FREQUENCIES = ["daily", "weekly", "monthly", "manual"] as const;

export const riskCategories = [
  "Data Collection",
  "Data Sharing",
  "Sale or Monetization of Data",
  "Advertising and Tracking",
  "AI Training / Content Use",
  "Data Retention and Deletion",
  "Security Controls",
  "User Rights and Control",
  "Children / Sensitive Data",
  "Legal Control",
  "Business / Vendor Risk",
  "Policy Change Risk",
] as const;
export const RISK_CATEGORIES = riskCategories;

export const serviceStatuses = ["active", "paused", "draft", "archived"] as const;
export const suggestionStatuses = ["pending", "approved", "rejected", "already_tracked", "needs_more_info"] as const;
export const policyChangeStatuses = ["pending_review", "approved", "rejected", "published", "ignored"] as const;

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 9) return "Critical";
  if (score >= 7) return "High";
  if (score >= 5) return "Elevated";
  if (score >= 3) return "Moderate";
  return "Low";
}

export const severityFromScore = riskLevelFromScore;

export const RISK_BADGE_CLASSES: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Elevated: "bg-orange-100 text-orange-800 border-orange-200",
  High: "bg-red-100 text-red-800 border-red-200",
  Critical: "bg-slate-950 text-white border-slate-950",
};
