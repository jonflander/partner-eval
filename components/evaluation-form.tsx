"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CRITERIA_DEFINITIONS,
  CriterionKey,
  EvaluationInput,
  Confidence,
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

const TIER_WEIGHTS = {
  1: "3x weight · Critical",
  2: "2x weight · High",
  3: "1x weight · Supporting",
};

const TIER_COLORS = {
  1: "text-[var(--red)]",
  2: "text-[var(--yellow)]",
  3: "text-primary",
};

const DEFAULT_CRITERION = { score: 3, confidence: "" as Confidence, validationNeeded: "", notes: "" };

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
  onSubmit: (input: EvaluationInput) => void;
}

export function EvaluationForm({ onSubmit }: Props) {
  const [form, setForm] = useState<EvaluationInput>(DEFAULT_INPUT);

  const setMeta = (field: keyof Pick<EvaluationInput, "partnerName" | "league" | "venue" | "season">, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setCriterion = (key: CriterionKey, field: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as object), [field]: value },
    }));
  };

  const tierKeys = (tier: 1 | 2 | 3) =>
    (Object.keys(CRITERIA_DEFINITIONS) as CriterionKey[]).filter(
      (k) => CRITERIA_DEFINITIONS[k].tier === tier
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Partner Info */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Partner Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Partner / Organization *</label>
            <Input
              required
              placeholder="e.g. Dallas Cowboys"
              value={form.partnerName}
              onChange={(e) => setMeta("partnerName", e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">League / Competition</label>
            <Input
              placeholder="e.g. NFL"
              value={form.league}
              onChange={(e) => setMeta("league", e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Venue(s)</label>
            <Input
              placeholder="e.g. AT&T Stadium"
              value={form.venue}
              onChange={(e) => setMeta("venue", e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Season / Dates</label>
            <Input
              placeholder="e.g. 2025–2026"
              value={form.season}
              onChange={(e) => setMeta("season", e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
        </div>
      </section>

      {/* Tier sections */}
      {([1, 2, 3] as const).map((tier) => (
        <section key={tier} className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className={cn("text-base font-bold", TIER_COLORS[tier])}>
              {TIER_LABELS[tier]}
            </h2>
            <Badge variant="outline" className="self-start sm:self-auto text-xs font-medium border-border text-muted-foreground">
              {TIER_WEIGHTS[tier]}
            </Badge>
          </div>

          <div className="space-y-6">
            {tierKeys(tier).map((key) => {
              const def = CRITERIA_DEFINITIONS[key];
              const val = form[key] as { score: number; confidence: Confidence; validationNeeded: string; notes: string };
              const scoreDescriptions = (def as any).scoreDescriptions as Record<number, string>;

              return (
                <div key={key} className="rounded-lg border border-border bg-secondary/30 p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{def.label}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{def.description}</p>
                  </div>

                  {/* Score selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Score</label>
                      <span className="text-sm font-bold text-primary">{val.score}/5</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCriterion(key, "score", s)}
                          className={cn(
                            "flex-1 rounded-md py-2.5 text-sm font-bold transition-all border",
                            val.score === s
                              ? s <= 1
                                ? "bg-[var(--red)] border-[var(--red)] text-white"
                                : s === 2
                                ? "bg-orange-600 border-orange-600 text-white"
                                : s === 3
                                ? "bg-[var(--yellow)] border-[var(--yellow)] text-black"
                                : s === 4
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-[var(--green)] border-[var(--green)] text-white"
                              : "bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      {scoreDescriptions[val.score]}
                    </p>
                  </div>

                  {/* Confidence */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confidence</label>
                    <div className="flex gap-2">
                      {(["H", "M", "L"] as Confidence[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCriterion(key, "confidence", val.confidence === c ? "" : c)}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-semibold transition-all border",
                            val.confidence === c
                              ? c === "H"
                                ? "bg-[var(--green)] border-[var(--green)] text-white"
                                : c === "M"
                                ? "bg-[var(--yellow)] border-[var(--yellow)] text-black"
                                : "bg-[var(--red)] border-[var(--red)] text-white"
                              : "bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          )}
                        >
                          {c === "H" ? "High" : c === "M" ? "Medium" : "Low"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Validation + Notes */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Validation Needed
                      </label>
                      <Input
                        placeholder="What info would increase confidence?"
                        value={val.validationNeeded}
                        onChange={(e) => setCriterion(key, "validationNeeded", e.target.value)}
                        className="bg-card border-border text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Notes
                      </label>
                      <Input
                        placeholder="Additional context..."
                        value={val.notes}
                        onChange={(e) => setCriterion(key, "notes", e.target.value)}
                        className="bg-card border-border text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground font-bold text-base py-6 rounded-xl hover:opacity-90 transition-opacity">
        Generate Evaluation Report
      </Button>
    </form>
  );
}
