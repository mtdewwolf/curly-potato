import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import { normalizePolicyText } from "@/lib/policies/normalize";

export type FetchPolicyResult =
  | {
      ok: true;
      fetchedUrl: string;
      rawHtml: string;
      cleanedText: string;
      detectedTitle: string | null;
    }
  | {
      ok: false;
      status?: number;
      error: string;
    };

const MIN_POLICY_LENGTH = 500;

const blockedPatterns = [
  /cloudflare/i,
  /checking your browser/i,
  /enable javascript and cookies/i,
  /access denied/i,
  /captcha/i,
  /sign in/i,
  /log in/i,
  /page not found/i,
  /not found/i,
  /server error/i,
  /temporarily unavailable/i,
];

const policySignals = [
  /privacy/i,
  /terms/i,
  /personal information/i,
  /personal data/i,
  /cookies/i,
  /data retention/i,
  /third parties/i,
  /arbitration/i,
  /liability/i,
  /user content/i,
];

export async function fetchPolicyDocument(url: string): Promise<FetchPolicyResult> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        "User-Agent":
          "TOS Sentinel policy monitor (+https://example.com; public-interest policy change tracking)",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return { ok: false, status: response.status, error: `Fetch failed with HTTP ${response.status}` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = await response.text();
    const extracted = extractReadablePolicyText(body, response.url, contentType);
    if (!extracted.ok) {
      return extracted;
    }

    return {
      ok: true,
      fetchedUrl: response.url,
      rawHtml: body,
      cleanedText: extracted.cleanedText,
      detectedTitle: extracted.detectedTitle,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
}

export const fetchPolicyText = fetchPolicyDocument;

function extractReadablePolicyText(
  body: string,
  url: string,
  contentType: string,
): FetchPolicyResult {
  const rawText = contentType.includes("text/plain") ? body : htmlToText(body, url);
  const cleanedText = normalizePolicyText(rawText);
  const detectedTitle = detectTitle(body);

  const rejectionReason = validatePolicyText(cleanedText);
  if (rejectionReason) {
    return { ok: false, error: rejectionReason };
  }

  return {
    ok: true,
    fetchedUrl: url,
    rawHtml: body,
    cleanedText,
    detectedTitle,
  };
}

function htmlToText(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (article?.textContent && article.textContent.length > MIN_POLICY_LENGTH) {
    return article.textContent;
  }

  const $ = cheerio.load(html);
  $("script,style,noscript,svg,canvas,iframe,form,nav,footer,header").remove();
  return $("body").text() || $.text();
}

function detectTitle(html: string) {
  const $ = cheerio.load(html);
  return $("title").first().text().trim() || $("h1").first().text().trim() || null;
}

function validatePolicyText(text: string) {
  if (text.length < MIN_POLICY_LENGTH) {
    return "Rejected snapshot: cleaned text is under 500 characters";
  }

  if (blockedPatterns.some((pattern) => pattern.test(text.slice(0, 3000)))) {
    return "Rejected snapshot: page appears to be bot protection, login, or error content";
  }

  const signalCount = policySignals.filter((pattern) => pattern.test(text)).length;
  if (signalCount < 2) {
    return "Rejected snapshot: text does not appear to contain policy-like content";
  }

  return null;
}
