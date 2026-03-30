"use client";

import { useState } from "react";
import { EvaluationResult, CriterionResult } from "@/lib/rubric";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRadarChart } from "@/components/score-radar-chart";
import { TierBreakdown } from "@/components/tier-breakdown";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  result: EvaluationResult;
  onReset: () => void;
}

const DECISION_CONFIG = {
  Greenlight: {
    label: "Greenlight",
    sublabel: "Priority — Actively pursue",
    bg: "bg-[var(--green)]/10 border-[var(--green)]/30",
    text: "text-[var(--green)]",
    dot: "bg-[var(--green)]",
    badge: "bg-[var(--green)] text-white",
  },
  Conditional: {
    label: "Conditional",
    sublabel: "Viable with specific conditions",
    bg: "bg-[var(--yellow)]/10 border-[var(--yellow)]/30",
    text: "text-[var(--yellow)]",
    dot: "bg-[var(--yellow)]",
    badge: "bg-[var(--yellow)] text-black",
  },
  Pass: {
    label: "Pass",
    sublabel: "Deprioritize — Low probability",
    bg: "bg-[var(--red)]/10 border-[var(--red)]/30",
    text: "text-[var(--red)]",
    dot: "bg-[var(--red)]",
    badge: "bg-[var(--red)] text-white",
  },
};

function ScoreMeter({ score, max }: { score: number; max: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const color =
    pct >= 76
      ? "var(--green)"
      : pct >= 59
      ? "var(--yellow)"
      : "var(--red)";
  const condThreshold = Math.round(max * 0.588);
  const greenThreshold = Math.round(max * 0.765);

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <span className="text-5xl font-black tracking-tight" style={{ color }}>
          {score}
        </span>
        <span className="text-lg text-muted-foreground font-medium mb-1">/{max}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0 — Pass</span>
        <span>{condThreshold} — Conditional</span>
        <span>{greenThreshold}+ — Greenlight</span>
      </div>
    </div>
  );
}

function ConfidenceBar({ breakdown }: { breakdown: EvaluationResult["confidenceBreakdown"] }) {
  const { high, medium, low, total } = breakdown;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Confidence Distribution
      </p>
      <div className="flex h-2.5 w-full rounded-full overflow-hidden">
        {high > 0 && (
          <div
            className="h-full bg-[var(--green)] transition-all"
            style={{ width: `${(high / total) * 100}%` }}
          />
        )}
        {medium > 0 && (
          <div
            className="h-full bg-[var(--yellow)] transition-all"
            style={{ width: `${(medium / total) * 100}%` }}
          />
        )}
        {low > 0 && (
          <div
            className="h-full bg-[var(--red)] transition-all"
            style={{ width: `${(low / total) * 100}%` }}
          />
        )}
        {high + medium + low < total && (
          <div
            className="h-full bg-border"
            style={{ width: `${((total - high - medium - low) / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--green)] inline-block" /> High ({high})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--yellow)] inline-block" /> Medium ({medium})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--red)] inline-block" /> Low ({low})</span>
        {(high + medium + low) < total && (
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-border inline-block" /> Unset ({total - high - medium - low})</span>
        )}
      </div>
    </div>
  );
}

function CriterionRow({ criterion }: { criterion: CriterionResult }) {
  const score = criterion.score;
  const dotColor =
    score >= 4 ? "bg-[var(--green)]" : score === 3 ? "bg-[var(--yellow)]" : "bg-[var(--red)]";

  const confColor =
    criterion.confidence === "H"
      ? "text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/30"
      : criterion.confidence === "M"
      ? "text-[var(--yellow)] bg-[var(--yellow)]/10 border-[var(--yellow)]/30"
      : criterion.confidence === "L"
      ? "text-[var(--red)] bg-[var(--red)]/10 border-[var(--red)]/30"
      : "text-muted-foreground bg-secondary border-border";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", dotColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <span className="font-medium text-sm text-foreground">{criterion.label}</span>
          <div className="flex items-center gap-2 shrink-0">
            {criterion.confidence && (
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", confColor)}>
                {criterion.confidence === "H" ? "High" : criterion.confidence === "M" ? "Med" : "Low"} conf.
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {score}/5 × {criterion.weight} = <span className="text-foreground font-bold">{criterion.weightedScore}</span>
            </span>
          </div>
        </div>
        {criterion.validationNeeded && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            Validation needed: {criterion.validationNeeded}
          </p>
        )}
        {criterion.notes && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {criterion.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export function ScoreReport({ result, onReset }: Props) {
  const [exporting, setExporting] = useState(false);
  const cfg = DECISION_CONFIG[result.decision];
  const tier1 = result.criteria.filter((c) => c.tier === 1);
  const tier2 = result.criteria.filter((c) => c.tier === 2);
  const tier3 = result.criteria.filter((c) => c.tier === 3);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { exportToPptx } = await import("@/lib/export-pptx");
      await exportToPptx(result);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground text-balance">
            {result.partner.partnerName || "Partner"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {[result.partner.league, result.partner.venue, result.partner.season]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="border-border text-foreground hover:bg-secondary gap-2"
          >
            {exporting ? (
              <>
                <Spinner className="w-3.5 h-3.5" />
                Exporting...
              </>
            ) : (
              "Export to PowerPoint"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            className="border-border text-foreground hover:bg-secondary"
          >
            New Evaluation
          </Button>
        </div>
      </div>

      {/* Decision + Score Hero */}
      <div className={cn("rounded-xl border p-6 space-y-5", cfg.bg)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", cfg.dot)} />
            <div>
              <p className={cn("text-2xl font-black", cfg.text)}>{cfg.label}</p>
              <p className="text-sm text-muted-foreground">{cfg.sublabel}</p>
            </div>
          </div>
          {result.autoRedFlag && (
            <Badge className="bg-[var(--red)] text-white text-xs self-start sm:self-auto">
              Auto Red Flag — Tier 1 Score of 1 Detected
            </Badge>
          )}
        </div>

        <ScoreMeter score={result.totalWeightedScore} max={result.maxPossibleScore} />
        <ConfidenceBar breakdown={result.confidenceBreakdown} />
      </div>

      {/* Summary narrative */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Evaluation Summary
        </h2>
        <p className="text-foreground leading-relaxed">{result.summaryNarrative}</p>
      </div>

      {/* Radar + Tier breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Score Radar
          </h2>
          <ScoreRadarChart criteria={result.criteria} />
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Score by Tier
          </h2>
          <TierBreakdown criteria={result.criteria} />
        </div>
      </div>

      {/* Risks & Upside */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--red)]/20 bg-card p-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--red)]">
            Key Risks
          </h2>
          {result.keyRisks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No material risks identified.</p>
          ) : (
            <ul className="space-y-2">
              {result.keyRisks.map((r, i) => (
                <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2">
                  <span className="text-[var(--red)] font-bold shrink-0 mt-0.5">—</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[var(--green)]/20 bg-card p-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--green)]">
            Key Upside
          </h2>
          {result.keyUpsides.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No strong upsides recorded.</p>
          ) : (
            <ul className="space-y-2">
              {result.keyUpsides.map((u, i) => (
                <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2">
                  <span className="text-[var(--green)] font-bold shrink-0 mt-0.5">+</span>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detailed Scorecard */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Full Scorecard
        </h2>

        {[
          { label: "Tier 1 — Execution & Monetization Foundation", criteria: tier1, color: "text-[var(--red)]", weight: `${result.tierWeights.tier1}×` },
          { label: "Tier 2 — Value Creation & Network Building", criteria: tier2, color: "text-[var(--yellow)]", weight: `${result.tierWeights.tier2}×` },
          { label: "Tier 3 — Operational Feasibility", criteria: tier3, color: "text-primary", weight: `${result.tierWeights.tier3}×` },
        ].map(({ label, criteria, color, weight }) => {
          const tierTotal = criteria.reduce((s, c) => s + c.weightedScore, 0);
          return (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className={cn("text-sm font-bold", color)}>{label}</h3>
                <span className="text-xs text-muted-foreground font-mono">
                  Subtotal: <span className="text-foreground font-bold">{tierTotal}</span>
                </span>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 px-4">
                {criteria.map((c) => (
                  <CriterionRow key={c.key} criterion={c} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
