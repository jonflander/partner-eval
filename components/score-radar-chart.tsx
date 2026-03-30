"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
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
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg">
        <p className="font-semibold">{d.fullLabel}</p>
        <p className="text-muted-foreground">Score: <span className="text-foreground font-bold">{d.score}/5</span></p>
      </div>
    );
  }
  return null;
}

export function ScoreRadarChart({ criteria }: Props) {
  const data = criteria.map((c) => ({
    label: SHORT_LABELS[c.key] || c.label,
    fullLabel: c.label,
    score: c.score,
    key: c.key,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="oklch(0.25 0.015 250)" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fill: "oklch(0.6 0.02 250)", fontSize: 11, fontWeight: 500 }}
        />
        <Radar
          dataKey="score"
          stroke="oklch(0.62 0.19 255)"
          fill="oklch(0.62 0.19 255)"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ r: 3, fill: "oklch(0.62 0.19 255)", strokeWidth: 0 }}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
