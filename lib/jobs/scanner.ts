import { diffLines } from "diff";

import { analyzePolicyChange, generateRiskReport } from "@/lib/ai/client";
import { severityFromScore } from "@/lib/constants";
import { sendPolicyChangeEmail } from "@/lib/email";
import { fetchPolicyText } from "@/lib/policies/fetcher";
import { contentHash } from "@/lib/policies/normalize";
import { createServiceClient } from "@/lib/supabase/admin";
import type { PolicyChangeAnalysis, RiskReportAnalysis } from "@/lib/ai/schemas";

type ScanResult = {
  changed: boolean;
  snapshotId?: string;
  policyChangeId?: string;
  message: string;
};

type PolicyDocumentRow = {
  id: string;
  service_id: string;
  document_type: string;
  title: string | null;
  url: string;
  latest_snapshot_id: string | null;
};

function compactDiff(oldText: string, newText: string) {
  const parts = diffLines(oldText, newText);
  return parts
    .filter((part) => part.added || part.removed)
    .slice(0, 80)
    .map((part) => `${part.added ? "+ " : "- "}${part.value.trim()}`)
    .join("\n\n")
    .slice(0, 50000);
}

async function writeScanLog(input: {
  policyDocumentId: string;
  status: "started" | "success" | "failed" | "skipped";
  message?: string;
  changed?: boolean;
  error?: string;
  finished?: boolean;
}) {
  const supabase = createServiceClient();
  await supabase.from("scan_logs").insert({
    policy_document_id: input.policyDocumentId,
    status: input.status,
    message: input.message,
    changed: input.changed,
    error: input.error,
    finished_at: input.finished ? new Date().toISOString() : null,
  });
}

async function persistRiskReport(document: PolicyDocumentRow, snapshotId: string, analysis: RiskReportAnalysis) {
  const supabase = createServiceClient();
  const { data: report, error } = await supabase
    .from("risk_reports")
    .insert({
      policy_document_id: document.id,
      snapshot_id: snapshotId,
      overall_score: analysis.overall_assessment.overall_score,
      overall_level: analysis.overall_assessment.overall_severity,
      summary: analysis.overall_assessment.summary,
      plain_english_summary: analysis.plain_english_summary,
      confidence: analysis.document_metadata.confidence,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw error;

  await supabase.from("risk_findings").insert(
    analysis.category_scores.map((finding) => ({
      risk_report_id: report.id,
      category: finding.category,
      severity: finding.severity,
      score: finding.score,
      confidence: finding.confidence,
      title: finding.category,
      evidence: finding.evidence,
      explanation: finding.analysis,
      user_impact: finding.user_impact,
      mitigation: finding.mitigation,
    })),
  );
}

async function persistPolicyChange(
  document: PolicyDocumentRow,
  oldSnapshotId: string,
  newSnapshotId: string,
  analysis: PolicyChangeAnalysis,
) {
  const supabase = createServiceClient();
  const { data: change, error } = await supabase
    .from("policy_changes")
    .insert({
      policy_document_id: document.id,
      old_snapshot_id: oldSnapshotId,
      new_snapshot_id: newSnapshotId,
      change_summary: analysis.summary,
      risk_impact_score: analysis.overall_risk_impact_score,
      risk_impact_level: analysis.overall_risk_impact_level || severityFromScore(analysis.overall_risk_impact_score),
      status: analysis.meaningful_change_detected ? "pending_review" : "ignored",
    })
    .select("id")
    .single();

  if (error) throw error;

  if (analysis.findings.length > 0) {
    await supabase.from("policy_change_findings").insert(
      analysis.findings.map((finding) => ({
        policy_change_id: change.id,
        category: finding.category,
        severity: finding.severity,
        confidence: finding.confidence,
        title: finding.title,
        what_changed: finding.what_changed,
        before_text: finding.old_text,
        after_text: finding.new_text,
        explanation: finding.why_it_matters,
        user_impact: finding.user_impact,
      })),
    );
  }

  return change.id;
}

export async function scanPolicyDocument(policyDocumentId: string): Promise<ScanResult> {
  const supabase = createServiceClient();
  await writeScanLog({ policyDocumentId, status: "started", message: "Scan started" });

  const { data: document, error: documentError } = await supabase
    .from("policy_documents")
    .select("id, service_id, document_type, title, url, latest_snapshot_id")
    .eq("id", policyDocumentId)
    .single();

  if (documentError || !document) {
    await writeScanLog({
      policyDocumentId,
      status: "failed",
      message: "Policy document not found",
      error: documentError?.message,
      finished: true,
    });
    throw documentError ?? new Error("Policy document not found");
  }

  try {
    const fetched = await fetchPolicyText(document.url);
    if (!fetched.ok) {
      throw new Error(fetched.error);
    }
    const hash = contentHash(fetched.cleanedText);

    const { data: latestSnapshot } = document.latest_snapshot_id
      ? await supabase
          .from("policy_snapshots")
          .select("id, cleaned_text, content_hash")
          .eq("id", document.latest_snapshot_id)
          .maybeSingle()
      : await supabase
          .from("policy_snapshots")
          .select("id, cleaned_text, content_hash")
          .eq("policy_document_id", document.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

    if (latestSnapshot?.content_hash === hash) {
      await supabase.from("policy_documents").update({ last_checked_at: new Date().toISOString() }).eq("id", document.id);
      await writeScanLog({
        policyDocumentId,
        status: "success",
        message: "Content unchanged",
        changed: false,
        finished: true,
      });
      return { changed: false, message: "Content unchanged" };
    }

    const { data: snapshot, error: snapshotError } = await supabase
      .from("policy_snapshots")
      .upsert(
        {
          policy_document_id: document.id,
          fetched_url: fetched.fetchedUrl,
          raw_html: fetched.rawHtml,
          cleaned_text: fetched.cleanedText,
          content_hash: hash,
          detected_title: fetched.detectedTitle,
        },
        { onConflict: "policy_document_id,content_hash", ignoreDuplicates: false },
      )
      .select("id")
      .single();

    if (snapshotError) throw snapshotError;

    await supabase
      .from("policy_documents")
      .update({
        latest_snapshot_id: snapshot.id,
        last_checked_at: new Date().toISOString(),
        last_changed_at: new Date().toISOString(),
      })
      .eq("id", document.id);

    let policyChangeId: string | undefined;
    if (!latestSnapshot) {
      const riskReport = await generateRiskReport({
        companyName: document.title ?? "Tracked service",
        documentType: document.document_type,
        policyText: fetched.cleanedText,
      });
      if (!riskReport.ok) throw new Error(riskReport.error);
      await persistRiskReport(document, snapshot.id, riskReport.data);
    } else {
      const diff = compactDiff(latestSnapshot.cleaned_text, fetched.cleanedText);
      const change = await analyzePolicyChange({
        companyName: document.title ?? "Tracked service",
        documentType: document.document_type,
        oldText: latestSnapshot.cleaned_text,
        newText: fetched.cleanedText,
        diffText: diff,
      });
      if (!change.ok) throw new Error(change.error);
      policyChangeId = await persistPolicyChange(document, latestSnapshot.id, snapshot.id, change.data);
    }

    await writeScanLog({
      policyDocumentId,
      status: "success",
      message: "Content changed and analysis queued for review",
      changed: true,
      finished: true,
    });
    return { changed: true, snapshotId: snapshot.id, policyChangeId, message: "Content changed" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scan error";
    await writeScanLog({
      policyDocumentId,
      status: "failed",
      message: "Scan failed",
      error: message,
      finished: true,
    });
    throw error;
  }
}

export async function scanDuePolicies() {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { data: documents, error } = await supabase
    .from("policy_documents")
    .select("id, scan_frequency, last_checked_at")
    .eq("status", "active")
    .neq("scan_frequency", "manual");

  if (error) throw error;

  const due = (documents ?? []).filter((document) => {
    if (!document.last_checked_at) return true;
    const lastChecked = new Date(document.last_checked_at).getTime();
    const ageMs = Date.now() - lastChecked;
    const day = 24 * 60 * 60 * 1000;
    const frequencyMs = document.scan_frequency === "weekly" ? 7 * day : document.scan_frequency === "monthly" ? 30 * day : day;
    return ageMs >= frequencyMs;
  });

  const results = [];
  for (const document of due) {
    try {
      results.push(await scanPolicyDocument(document.id));
    } catch (error) {
      results.push({ changed: false, message: error instanceof Error ? error.message : "Failed" });
    }
  }

  return { scannedAt: now, scannedCount: due.length, results };
}

export async function publishPolicyChange(policyChangeId: string, reviewerId: string, editedSummary?: string) {
  const supabase = createServiceClient();
  const { data: change, error } = await supabase
    .from("policy_changes")
    .select(
      "id, policy_document_id, change_summary, risk_impact_level, policy_documents(document_type, tracked_services(id, name, slug))",
    )
    .eq("id", policyChangeId)
    .single();

  if (error) throw error;
  const document = Array.isArray(change.policy_documents) ? change.policy_documents[0] : change.policy_documents;
  const service = Array.isArray(document?.tracked_services) ? document?.tracked_services[0] : document?.tracked_services;
  if (!service) throw new Error("Policy change is not linked to a service");

  await supabase
    .from("policy_changes")
    .update({
      status: "published",
      change_summary: editedSummary || change.change_summary,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    })
    .eq("id", policyChangeId);

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("user_service_subscriptions")
    .select("user_id, notify_email, profiles(email)")
    .eq("service_id", service.id);
  if (subscriptionError) throw subscriptionError;

  const title = `${service.name} updated its ${document?.document_type ?? "policy"}`;
  const message = `Risk impact: ${change.risk_impact_level ?? "Unrated"}. ${
    editedSummary || change.change_summary || "A policy change was published."
  }`;

  if (subscriptions?.length) {
    await supabase.from("notifications").upsert(
      subscriptions.map((subscription) => ({
        user_id: subscription.user_id,
        service_id: service.id,
        policy_change_id: policyChangeId,
        title,
        message,
      })),
      { onConflict: "user_id,policy_change_id", ignoreDuplicates: true },
    );

    await Promise.all(
      subscriptions
        .filter((subscription) => subscription.notify_email)
        .map(async (subscription) => {
          const profile = Array.isArray(subscription.profiles) ? subscription.profiles[0] : subscription.profiles;
          if (!profile?.email) return;
          await sendPolicyChangeEmail({
            to: profile.email,
            serviceName: service.name,
            documentType: document?.document_type ?? "policy",
            riskLevel: change.risk_impact_level ?? "Unrated",
            summary: editedSummary || change.change_summary || "A policy change was published.",
            reportUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/services/${service.slug}/changes`,
          });
          await supabase
            .from("notifications")
            .update({ emailed_at: new Date().toISOString() })
            .eq("user_id", subscription.user_id)
            .eq("policy_change_id", policyChangeId);
        }),
    );
  }
}
