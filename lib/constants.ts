export const riskLevels = ["Low", "Moderate", "Elevated", "High", "Critical"] as const;

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
