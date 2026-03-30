"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CRITERIA_DEFINITIONS,
  CriterionKey,
  EvaluationInput,
  Confidence,
  TierWeights,
  DEFAULT_TIER_WEIGHTS,
} from "@/lib/rubric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const TIER_LABELS = {
  1: "Tier 1 — Execution & Monetization Foundation",
  2: "Tier 2 — Value Creation & Network Building",
  3: "Tier 3 — Operational Feasibility",
};

const TIER_COLORS = {
  1: "text-[var(--red)]",
  2: "text-[var(--yellow)]",
  3: "text-primary",
};

const TIER_BORDER_COLORS = {
  1: "border-[var(--red)]/30",
  2: "border-[var(--yellow)]/30",
  3: "border-primary/30",
};

const DEFAULT_CRITERION = {
  score: 3,
  confidence: "" as Confidence,
  validationNeeded: "",
  notes: "",
};

const DEFAULT_INPUT: EvaluationInput = {
  partnerName: "",
  league: "",
  venue: "",
  season: "",
  rightsFlexibility: { ...DEFAULT_CRITERION },
  activationSupport: { ...DEFAULT_CRITERION },
  saasConversion: { ...DEFAULT_CRITERION },
  fanEngagement: { ...DEFAULT_CRITERION },
  networkContribution: { ...DEFAULT_CRITERION },
  technicalInfrastructure: { ...DEFAULT_CRITERION },
  economics: { ...DEFAULT_CRITERION },
  monetizationAlignment: { ...DEFAULT_CRITERION },
  operationalComplexity: { ...DEFAULT_CRITERION },
};

interface Props {
  onSubmit: (input: EvaluationInput, weights: TierWeights) => void;
}

const SCORE_COLORS: Record<number, string> = {
  1: "bg-[var(--red)] border-[var(--red)] text-white",
  2: "bg-orange-600 border-orange-600 text-white",
  3: "bg-[var(--yellow)] border-[var(--yellow)] text-black",
  4: "bg-emerald-600 border-emerald-600 text-white",
  5: "bg-[var(--green)] border-[var(--green)] text-white",
};

const WEIGHT_PRESETS = [
  { label: "Default (3/2/1)", weights: { tier1: 3, tier2: 2, tier3: 1 } },
  { label: "Monetization heavy (4/2/1)", weights: { tier1: 4, tier2: 2, tier3: 1 } },
  { label: "Equal (1/1/1)", weights: { tier1: 1, tier2: 1, tier3: 1 } },
];

function WeightSlider({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("text-xs font-semibold w-24 shrink-0", color)}>{label}</span>
      <div className="flex gap-1.5 flex-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 h-7 rounded text-xs font-bold border transition-all",
              value === v
                ? color === "text-[var(--red)]"
                  ? "bg-[var(--red)] border-[var(--red)] text-white"
                  : color === "text-[var(--yellow)]"
                  ? "bg-[var(--yellow)] border-[var(--yellow)] text-black"
                  : "bg-primary border-primary text-primary-foreground"
                : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            {v}×
          </button>
        ))}
      </div>
    </div>
  );
}

export function EvaluationForm({ onSubmit }: Props) {
  const [form, setForm] = useState<EvaluationInput>(DEFAULT_INPUT);
  const [weights, setWeights] = useState<TierWeights>(DEFAULT_TIER_WEIGHTS);

  const setMeta = (
    field: keyof Pick<EvaluationInput, "partnerName" | "league" | "venue" | "season">,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setCriterion = (key: CriterionKey, field: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as object), [field]: value },
    }));
  };

  const setWeight = (tier: keyof TierWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [tier]: value }));
  };

  const tierKeys = (tier: 1 | 2 | 3) =>
    (Object.keys(CRITERIA_DEFINITIONS) as CriterionKey[]).filter(
      (k) => CRITERIA_DEFINITIONS[k].tier === tier
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form, weights);
  };

  const maxScore =
    tierKeys(1).length * 5 * weights.tier1 +
    tierKeys(2).length * 5 * weights.tier2 +
    tierKeys(3).length * 5 * weights.tier3;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Partner Info */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Partner Information
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Partner / Organization *</label>
            <Input
              required
              placeholder="e.g. Dallas Cowboys"
              value={form.partnerName}
              onChange={(e) => setMeta("partnerName", e.target.value)}
              className="bg-secondary border-border h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">League</label>
            <Input
              placeholder="e.g. NFL"
              value={form.league}
              onChange={(e) => setMeta("league", e.target.value)}
              className="bg-secondary border-border h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Season</label>
            <Input
              placeholder="e.g. 2025–26"
              value={form.season}
              onChange={(e) => setMeta("season", e.target.value)}
              className="bg-secondary border-border h-8 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Tier Weight Configuration */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Tier Weights
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adjust how each tier is weighted. Max score:{" "}
              <span className="font-bold text-foreground">{maxScore}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {WEIGHT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setWeights(p.weights)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-md border transition-all",
                  JSON.stringify(weights) === JSON.stringify(p.weights)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          <WeightSlider
            label="Tier 1"
            value={weights.tier1}
            color="text-[var(--red)]"
            onChange={(v) => setWeight("tier1", v)}
          />
          <WeightSlider
            label="Tier 2"
            value={weights.tier2}
            color="text-[var(--yellow)]"
            onChange={(v) => setWeight("tier2", v)}
          />
          <WeightSlider
            label="Tier 3"
            value={weights.tier3}
            color="text-primary"
            onChange={(v) => setWeight("tier3", v)}
          />
        </div>
      </section>

      {/* Tier sections */}
      {([1, 2, 3] as const).map((tier) => (
        <section
          key={tier}
          className={cn(
            "rounded-xl border bg-card p-5 space-y-4",
            TIER_BORDER_COLORS[tier]
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className={cn("text-sm font-bold", TIER_COLORS[tier])}>
              {TIER_LABELS[tier]}
            </h2>
            <Badge
              variant="outline"
              className="text-xs font-mono border-border text-muted-foreground shrink-0"
            >
              {weights[`tier${tier}` as keyof TierWeights]}× weight
            </Badge>
          </div>

          <div className="space-y-4">
            {tierKeys(tier).map((key) => {
              const def = CRITERIA_DEFINITIONS[key];
              const val = form[key] as {
                score: number;
                confidence: Confidence;
                validationNeeded: string;
                notes: string;
              };
              const scoreDescriptions = (def as any).scoreDescriptions as Record<number, string>;

              return (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3"
                >
                  {/* Criterion header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground">{def.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {def.description}
                      </p>
                    </div>
                  </div>

                  {/* Score + Confidence inline row */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Score buttons */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score</span>
                        <span className="text-xs font-bold text-primary font-mono">{val.score}/5</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setCriterion(key, "score", s)}
                            title={scoreDescriptions[s]}
                            className={cn(
                              "flex-1 rounded py-1.5 text-xs font-bold transition-all border",
                              val.score === s
                                ? SCORE_COLORS[s]
                                : "bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic leading-snug">
                        {scoreDescriptions[val.score]}
                      </p>
                    </div>

                    {/* Confidence buttons */}
                    <div className="sm:w-40 space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                        Confidence
                      </span>
                      <div className="flex gap-1.5 sm:flex-col">
                        {(["H", "M", "L"] as Confidence[]).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() =>
                              setCriterion(key, "confidence", val.confidence === c ? "" : c)
                            }
                            className={cn(
                              "flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-semibold transition-all border",
                              val.confidence === c
                                ? c === "H"
                                  ? "bg-[var(--green)] border-[var(--green)] text-white"
                                  : c === "M"
                                  ? "bg-[var(--yellow)] border-[var(--yellow)] text-black"
                                  : "bg-[var(--red)] border-[var(--red)] text-white"
                                : "bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                            )}
                          >
                            {c === "H" ? "High" : c === "M" ? "Med" : "Low"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notes (expanded textarea) + Validation needed */}
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Notes
                      </label>
                      <Textarea
                        placeholder="Add context, evidence, or observations that support this score — deal specifics, partner feedback, comparable partnerships, etc."
                        value={val.notes}
                        onChange={(e) => setCriterion(key, "notes", e.target.value)}
                        rows={3}
                        className="bg-card border-border text-sm resize-none leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Validation Needed
                      </label>
                      <Input
                        placeholder="What specific information or due diligence would increase conviction?"
                        value={val.validationNeeded}
                        onChange={(e) => setCriterion(key, "validationNeeded", e.target.value)}
                        className="bg-card border-border text-sm h-8"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <Button
        type="submit"
        size="lg"
        className="w-full bg-primary text-primary-foreground font-bold text-sm py-5 rounded-xl hover:opacity-90 transition-opacity"
      >
        Generate Evaluation Report
      </Button>
    </form>
  );
}
