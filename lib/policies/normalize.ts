import crypto from "node:crypto";

const BOILERPLATE_PATTERNS = [
  /accept all cookies/gi,
  /manage cookie preferences/gi,
  /subscribe to our newsletter/gi,
  /skip to (main )?content/gi,
];

export function normalizePolicyText(input: string) {
  let text = input.replace(/\r\n?/g, "\n");

  for (const pattern of BOILERPLATE_PATTERNS) {
    text = text.replace(pattern, "");
  }

  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

export function hashPolicyText(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function looksLikeInvalidPolicy(text: string) {
  const lower = text.toLowerCase();
  const blockedSignals = [
    "checking your browser",
    "cloudflare ray id",
    "enable javascript and cookies",
    "access denied",
    "please log in",
    "sign in to continue",
    "page not found",
    "404",
    "500 internal server error",
  ];

  const policySignals = [
    "privacy",
    "terms",
    "personal data",
    "personal information",
    "cookies",
    "user content",
    "account",
    "security",
    "retention",
  ];

  return (
    text.length < 500 ||
    blockedSignals.some((signal) => lower.includes(signal)) ||
    policySignals.filter((signal) => lower.includes(signal)).length < 2
  );
}
