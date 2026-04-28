import { Resend } from "resend";

export type PolicyAlertEmail = {
  to: string;
  serviceName: string;
  documentType: string;
  riskLevel: string;
  summary: string;
  reportUrl: string;
};

export async function sendPolicyAlertEmail({
  to,
  serviceName,
  documentType,
  riskLevel,
  summary,
  reportUrl,
}: PolicyAlertEmail) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { skipped: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    subject: `TOS Sentinel Alert: ${serviceName} updated its ${documentType}`,
    text: `${serviceName} updated its ${documentType}.\n\nRisk impact: ${riskLevel}\n\nWhat changed:\n${summary}\n\nView full report:\n${reportUrl}`,
  });
}
