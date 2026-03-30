"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { CriterionResult } from "@/lib/rubric";

interface Props {
  criteria: CriterionResult[];
}

const SHORT_LABELS: Record<string, string> = {
  rightsFlexibility: "Rights",
  activationSupport: "Activation",
  saasConversion: "SaaS",
  fanEngagement: "Fan Engage.",
  networkContribution: "Network",
  technicalInfrastructure: "Tech Infra.",
  economics: "Economics",
  monetizationAlignment: "Monetize.",
  operationalComplexity: "Operations",
};

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const hasDiscount = d.rawScore !== d.effectiveScore;
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2.5 text-sm text-popover-foreground shadow-lg space-y-1 min-w-[180px]">
        <p className="font-semibold text-foreground">{d.fullLabel}</p>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Raw score</span>
          <span className="font-mono font-bold">{d.rawScore}/5</span>
        </div>
        {hasDiscount && (
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-muted-foreground">Confidence-adjusted</span>
            <span className="font-mono font-bold text-[oklch(0.72_0.17_162)]">{d.effectiveScore}/5</span>
          </div>
        )}
        {!hasDiscount && (
          <p className="text-xs text-muted-foreground italic">High confidence — no discount</p>
        )}
      </div>
    );
  }
  return null;
}

export function ScoreRadarChart({ criteria }: Props) {
  const data = criteria.map((c) => ({
    label: SHORT_LABELS[c.key] || c.label,
    fullLabel: c.label,
    rawScore: c.score,
    effectiveScore: c.effectiveScore5,
    key: c.key,
  }));

  // Only show the effective layer if any criterion actually has a discount
  const hasAnyDiscount = criteria.some((c) => c.confidenceMultiplier < 1.0);

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="oklch(0.25 0.015 250)" />
          <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "oklch(0.6 0.02 250)", fontSize: 11, fontWeight: 500 }}
          />
          {/* Raw score — shown as a ghost outline */}
          {hasAnyDiscount && (
            <Radar
              name="Raw score"
              dataKey="rawScore"
              stroke="oklch(0.62 0.19 255)"
              fill="oklch(0.62 0.19 255)"
              fillOpacity={0.08}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          )}
          {/* Confidence-adjusted (or sole layer if no discounts) */}
          <Radar
            name={hasAnyDiscount ? "Confidence-adjusted" : "Score"}
            dataKey={hasAnyDiscount ? "effectiveScore" : "rawScore"}
            stroke="oklch(0.72 0.17 162)"
            fill="oklch(0.72 0.17 162)"
            fillOpacity={0.22}
            strokeWidth={2}
            dot={{ r: 3, fill: "oklch(0.72 0.17 162)", strokeWidth: 0 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {hasAnyDiscount && (
            <Legend
              iconType="plainline"
              iconSize={16}
              formatter={(value) => (
                <span style={{ fontSize: 11, color: "oklch(0.6 0.02 250)" }}>{value}</span>
              )}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
      {hasAnyDiscount && (
        <p className="text-xs text-muted-foreground text-center italic">
          Dashed outline = raw scores · Solid fill = confidence-adjusted scores
        </p>
      )}
    </div>
  );
}
