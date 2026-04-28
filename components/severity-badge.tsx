import { RiskBadge } from "./risk-badge";

export function SeverityBadge({ severity }: { severity?: string | null }) {
  return <RiskBadge level={severity} />;
}
