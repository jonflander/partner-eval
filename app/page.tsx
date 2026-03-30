"use client";

import { useState } from "react";
import { EvaluationForm } from "@/components/evaluation-form";
import { ScoreReport } from "@/components/score-report";
import { computeEvaluation, EvaluationInput, EvaluationResult, TierWeights } from "@/lib/rubric";

export default function Home() {
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const handleSubmit = (input: EvaluationInput, weights: TierWeights) => {
    const evaluated = computeEvaluation(input, weights);
    setResult(evaluated);
    // Scroll to top on report
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-black">S</span>
            </div>
            <div>
              <span className="font-bold text-foreground text-sm">SEVN</span>
              <span className="text-muted-foreground text-sm"> / Partner Evaluator</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              9 criteria · Weighted scoring · Confidence tracking
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {!result ? (
          <div className="space-y-8">
            {/* Hero */}
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-foreground text-balance leading-tight">
                Partner Evaluation Framework
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                Score potential team and league partners using the SEVN rubric. Each criterion is
                weighted by tier to surface partners most likely to drive fan engagement, SaaS
                conversion, and network value. Add confidence ratings to flag where you need more
                conviction before committing.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">
                  <span className="w-2 h-2 rounded-full bg-[var(--red)] inline-block" />
                  Tier 1 criteria — 3× weight
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">
                  <span className="w-2 h-2 rounded-full bg-[var(--yellow)] inline-block" />
                  Tier 2 criteria — 2× weight
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Tier 3 criteria — 1× weight
                </div>
              </div>
            </div>

            {/* Score ranges reference */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { range: "top 24%", label: "Greenlight", sub: "Priority — actively pursue", color: "var(--green)" },
                { range: "59–76%", label: "Conditional", sub: "Viable with specific conditions", color: "var(--yellow)" },
                { range: "below 59%", label: "Pass", sub: "Deprioritize", color: "var(--red)" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-card px-4 py-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-sm text-foreground">{item.label}</span>
                  </div>
                  <p className="text-xs font-mono font-semibold" style={{ color: item.color }}>{item.range} of max</p>
                  <p className="text-xs text-muted-foreground leading-snug">{item.sub}</p>
                </div>
              ))}
            </div>

            <EvaluationForm onSubmit={handleSubmit} />
          </div>
        ) : (
          <ScoreReport result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-xs text-muted-foreground text-center">
            SEVN Partner Evaluation Framework · 9 criteria across 3 tiers · Tier 1 score of 1 triggers automatic Pass
          </p>
        </div>
      </footer>
    </div>
  );
}
