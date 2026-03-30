"use client";

import { CriterionResult } from "@/lib/rubric";
import { cn } from "@/lib/utils";

interface Props {
  criteria: CriterionResult[];
}

const TIER_CONFIG = {
  1: { label: "Tier 1", color: "var(--red)", bgClass: "bg-[var(--red)]", textClass: "text-[var(--red)]" },
  2: { label: "Tier 2", color: "var(--yellow)", bgClass: "bg-[var(--yellow)]", textClass: "text-[var(--yellow)]" },
  3: { label: "Tier 3", color: "var(--primary)", bgClass: "bg-primary", textClass: "text-primary" },
};

const SCORE_COLOR = (score: number) =>
  score >= 4 ? "var(--green)" : score === 3 ? "var(--yellow)" : "var(--red)";

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: SCORE_COLOR(score) }}
        />
      </div>
      <span
        className="text-sm font-bold w-6 text-right"
        style={{ color: SCORE_COLOR(score) }}
      >
        {score}
      </span>
    </div>
  );
}

export function TierBreakdown({ criteria }: Props) {
  const tiers = [1, 2, 3] as const;

  return (
    <div className="space-y-6">
      {tiers.map((tier) => {
        const tierCriteria = criteria.filter((c) => c.tier === tier);
        const cfg = TIER_CONFIG[tier];
        const tierMax = tierCriteria.reduce((s, c) => s + 5 * c.weight, 0);
        const tierActual = tierCriteria.reduce((s, c) => s + c.weightedScore, 0);
        const tierPct = Math.round((tierActual / tierMax) * 100);

        return (
          <div key={tier} className="space-y-3">
            {/* Tier header */}
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-bold uppercase tracking-widest", cfg.textClass)}>
                {cfg.label}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {tierActual}/{tierMax} ({tierPct}%)
              </span>
            </div>

            {/* Per-criterion bars */}
            <div className="space-y-2.5">
              {tierCriteria.map((c) => (
                <div key={c.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {c.label}
                    </span>
                    {c.confidence && (
                      <span
                        className="text-xs font-semibold shrink-0"
                        style={{
                          color:
                            c.confidence === "H"
                              ? "var(--green)"
                              : c.confidence === "M"
                              ? "var(--yellow)"
                              : "var(--red)",
                        }}
                      >
                        {c.confidence}
                      </span>
                    )}
                  </div>
                  <ScoreBar score={c.score} />
                </div>
              ))}
            </div>

            {/* Tier aggregate bar — % of max weighted points earned for this tier */}
            <div className="pt-1 border-t border-border space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tier score vs. max possible</span>
                <span className="font-bold" style={{ color: cfg.color }}>{tierPct}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${tierPct}%`, backgroundColor: cfg.color }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
