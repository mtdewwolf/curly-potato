import { RISK_BADGE_CLASSES, type RiskLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function RiskBadge({ level, className }: { level?: string | null; className?: string }) {
  const normalized = (level || "Low") as RiskLevel;
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", RISK_BADGE_CLASSES[normalized] || RISK_BADGE_CLASSES.Low, className)}>
      {normalized}
    </span>
  );
}
