export type Confidence = "H" | "M" | "L" | "";

export interface CriterionInput {
  score: number; // 1–5
  confidence: Confidence;
  validationNeeded: string;
  notes: string;
}

export interface EvaluationInput {
  partnerName: string;
  league: string;
  venue: string;
  season: string;
  // Tier 1
  rightsFlexibility: CriterionInput;
  activationSupport: CriterionInput;
  saasConversion: CriterionInput;
  // Tier 2
  fanEngagement: CriterionInput;
  networkContribution: CriterionInput;
  // Tier 3
  technicalInfrastructure: CriterionInput;
  economics: CriterionInput;
  monetizationAlignment: CriterionInput;
  operationalComplexity: CriterionInput;
}

// Confidence multipliers: High = full credit, Medium = 90%, Low = 75%, unset = 90%
export const CONFIDENCE_MULTIPLIERS: Record<string, number> = {
  H: 1.0,
  M: 0.9,
  L: 0.75,
  "": 0.9,
};

export interface CriterionResult extends CriterionInput {
  key: string;
  label: string;
  tier: 1 | 2 | 3;
  weight: number;
  rawWeightedScore: number;      // score × weight (before confidence adjustment)
  confidenceMultiplier: number;  // 0.75 | 0.9 | 1.0
  weightedScore: number;         // effective: score × weight × confidenceMultiplier (rounded 1dp)
  description: string;
  scaleLow: string;
  scaleHigh: string;
}

export interface TierWeights {
  tier1: number;
  tier2: number;
  tier3: number;
}

export const DEFAULT_TIER_WEIGHTS: TierWeights = {
  tier1: 3,
  tier2: 2,
  tier3: 1,
};

export interface EvaluationResult {
  partner: EvaluationInput;
  criteria: CriterionResult[];
  totalWeightedScore: number;
  maxPossibleScore: number;
  normalizedScore: number; // out of 100
  tier1Average: number;
  decision: "Greenlight" | "Conditional" | "Pass";
  autoRedFlag: boolean; // any Tier 1 = 1
  keyRisks: string[];
  keyUpsides: string[];
  summaryNarrative: string;
  confidenceBreakdown: { high: number; medium: number; low: number; total: number };
  tierWeights: TierWeights;
}

export const CRITERIA_DEFINITIONS = {
  rightsFlexibility: {
    label: "Rights Ownership & Flexibility",
    tier: 1 as const,
    weight: 3,
    description: "Ability to secure rights to distribute highlights through a manageable approval structure.",
    scaleLow: "Blocked or unclear",
    scaleHigh: "Rights owned centrally; simple agreement",
    scoreDescriptions: {
      1: "Blocked or unclear rights",
      2: "Complex; likely conflicts",
      3: "Fragmented; multiple approvals needed",
      4: "Mostly centralized; manageable approvals",
      5: "Rights owned centrally; simple agreement",
    },
  },
  activationSupport: {
    label: "Partner Activation & Fan Onboarding Support",
    tier: 1 as const,
    weight: 3,
    description: "Willingness to actively drive fan signups and engagement.",
    scaleLow: "No support",
    scaleHigh: "Full commitment across all channels",
    scoreDescriptions: {
      1: "No support",
      2: "Passive support",
      3: "Basic support",
      4: "Strong support",
      5: "Full commitment across all channels",
    },
  },
  saasConversion: {
    label: "SaaS Conversion Potential",
    tier: 1 as const,
    weight: 3,
    description: "Likelihood of converting to a paid SaaS relationship (12–24 months).",
    scaleLow: "No path",
    scaleHigh: "Clear budget + strong likelihood",
    scoreDescriptions: {
      1: "No path to SaaS",
      2: "Low likelihood",
      3: "Moderate / unclear",
      4: "Strong potential",
      5: "Clear budget + strong likelihood",
    },
  },
  fanEngagement: {
    label: "Fan Engagement & Data Potential",
    tier: 2 as const,
    weight: 2,
    description: "Likelihood of generating high-quality, high-signal fan data.",
    scaleLow: "Minimal expected engagement",
    scaleHigh: "Highly engaged, digital-first fan base",
    scoreDescriptions: {
      1: "Minimal engagement; fans unlikely to opt in",
      2: "Low engagement; data capture minimal",
      3: "Moderate engagement; interaction may be inconsistent",
      4: "Strong engagement; meaningful and actionable data",
      5: "Highly engaged, digital-first; rich behavioral data",
    },
  },
  networkContribution: {
    label: "Network Contribution Potential",
    tier: 2 as const,
    weight: 2,
    description: "Contribution to building a scalable, cross-team fan network.",
    scaleLow: "Highly isolated audience",
    scaleHigh: "Large, global, behavior-driven fan base",
    scoreDescriptions: {
      1: "Highly isolated; no contribution to network",
      2: "Primarily local/niche; weak network effects",
      3: "Moderate overlap; somewhat siloed fans",
      4: "Strong fan base with cross-team/league overlap",
      5: "Large, global; significantly increases network value",
    },
  },
  technicalInfrastructure: {
    label: "Technical Infrastructure & Integration",
    tier: 3 as const,
    weight: 1,
    description: "Feasibility of technical integration and content access.",
    scaleLow: "Integration unlikely or infeasible",
    scaleHigh: "Seamless integration; proven infrastructure",
    scoreDescriptions: {
      1: "Integration unlikely or infeasible",
      2: "Significant unknowns or likely resistance",
      3: "Feasible but requires customization",
      4: "Strong infrastructure; minor integration work",
      5: "Seamless integration; direct feed access",
    },
  },
  economics: {
    label: "Economics & Cost Certainty",
    tier: 3 as const,
    weight: 1,
    description: "Unit economics, cost predictability, and scalable revenue potential.",
    scaleLow: "Economics unclear or negative",
    scaleHigh: "Highly predictable costs; clear path to positive unit economics",
    scoreDescriptions: {
      1: "Economics unclear or negative",
      2: "High cost variability; revenue insufficient",
      3: "Moderate uncertainty; revenue may be limited",
      4: "Mostly predictable costs; solid revenue potential",
      5: "Highly predictable costs; strong scalable revenue",
    },
  },
  monetizationAlignment: {
    label: "Near-Term Monetization Alignment",
    tier: 3 as const,
    weight: 1,
    description: "Alignment on sponsorship and revenue share opportunities.",
    scaleLow: "No alignment",
    scaleHigh: "Fully aligned (sponsorship + SaaS)",
    scoreDescriptions: {
      1: "No alignment",
      2: "Limited",
      3: "Requires coordination",
      4: "Mostly aligned",
      5: "Fully aligned (sponsorship + SaaS)",
    },
  },
  operationalComplexity: {
    label: "Operational Execution Complexity",
    tier: 3 as const,
    weight: 1,
    description: "Burden and reliability of ongoing operations.",
    scaleLow: "Operationally infeasible or highly unreliable",
    scaleHigh: "Low burden; repeatable, reliable execution",
    scoreDescriptions: {
      1: "Operationally infeasible or highly unreliable",
      2: "High burden; multiple dependencies; execution risk",
      3: "Moderate complexity; requires active management",
      4: "Manageable with standard planning",
      5: "Low burden; repeatable, reliable execution",
    },
  },
} as const;

export type CriterionKey = keyof typeof CRITERIA_DEFINITIONS;

export function computeEvaluation(input: EvaluationInput, weights: TierWeights = DEFAULT_TIER_WEIGHTS): EvaluationResult {
  const criteriaKeys = Object.keys(CRITERIA_DEFINITIONS) as CriterionKey[];

  // Compute max weighted score based on custom weights
  const tier1Count = criteriaKeys.filter((k) => CRITERIA_DEFINITIONS[k].tier === 1).length;
  const tier2Count = criteriaKeys.filter((k) => CRITERIA_DEFINITIONS[k].tier === 2).length;
  const tier3Count = criteriaKeys.filter((k) => CRITERIA_DEFINITIONS[k].tier === 3).length;
  const MAX_WEIGHTED_SCORE = tier1Count * 5 * weights.tier1 + tier2Count * 5 * weights.tier2 + tier3Count * 5 * weights.tier3;

  const criteria: CriterionResult[] = criteriaKeys.map((key) => {
    const def = CRITERIA_DEFINITIONS[key];
    const inp = input[key] as CriterionInput;
    const tierWeight = def.tier === 1 ? weights.tier1 : def.tier === 2 ? weights.tier2 : weights.tier3;
    const multiplier = CONFIDENCE_MULTIPLIERS[inp.confidence ?? ""] ?? 0.9;
    const raw = inp.score * tierWeight;
    const effective = Math.round(raw * multiplier * 10) / 10;
    return {
      key,
      label: def.label,
      tier: def.tier,
      weight: tierWeight,
      score: inp.score,
      confidence: inp.confidence,
      validationNeeded: inp.validationNeeded,
      notes: inp.notes,
      rawWeightedScore: raw,
      confidenceMultiplier: multiplier,
      weightedScore: effective,
      description: def.description,
      scaleLow: def.scaleLow,
      scaleHigh: def.scaleHigh,
    };
  });

  const totalWeightedScore = criteria.reduce((sum, c) => sum + c.weightedScore, 0);
  const normalizedScore = Math.round((totalWeightedScore / MAX_WEIGHTED_SCORE) * 100);

  const tier1Criteria = criteria.filter((c) => c.tier === 1);
  // tier1Average uses effective (confidence-adjusted) score for decision-making
  const tier1Average = tier1Criteria.reduce((s, c) => s + c.score * c.confidenceMultiplier, 0) / tier1Criteria.length;
  const autoRedFlag = tier1Criteria.some((c) => c.score === 1);

  // Thresholds scale with max: ~59% = conditional floor, ~76% = greenlight floor
  const greenlightThreshold = Math.round(MAX_WEIGHTED_SCORE * 0.765);
  const conditionalThreshold = Math.round(MAX_WEIGHTED_SCORE * 0.588);

  let decision: EvaluationResult["decision"];
  if (autoRedFlag || tier1Criteria.some((c) => c.score <= 1) || totalWeightedScore < conditionalThreshold) {
    decision = "Pass";
  } else if (totalWeightedScore >= greenlightThreshold && !autoRedFlag && tier1Average >= 4 && tier1Criteria.every((c) => c.score >= 3)) {
    decision = "Greenlight";
  } else {
    decision = "Conditional";
  }

  // Build narrative
  const keyRisks: string[] = [];
  const keyUpsides: string[] = [];

  for (const c of criteria) {
    if (c.score <= 2) {
      const detail = (CRITERIA_DEFINITIONS[c.key as CriterionKey] as any).scoreDescriptions[c.score];
      keyRisks.push(`${c.label}: ${detail}${c.confidence === "L" ? " (low confidence — needs validation)" : ""}`);
    }
    if (c.score >= 4) {
      const detail = (CRITERIA_DEFINITIONS[c.key as CriterionKey] as any).scoreDescriptions[c.score];
      keyUpsides.push(`${c.label}: ${detail}${c.confidence === "H" ? "" : c.confidence === "M" ? " (medium confidence)" : " (needs validation to confirm)"}`);
    }
  }

  const lowConfidenceCriteria = criteria.filter((c) => c.confidence === "L" || c.confidence === "M");
  const confidenceBreakdown = {
    high: criteria.filter((c) => c.confidence === "H").length,
    medium: criteria.filter((c) => c.confidence === "M").length,
    low: criteria.filter((c) => c.confidence === "L").length,
    total: criteria.length,
  };

  const summaryNarrative = buildNarrative(input, criteria, totalWeightedScore, MAX_WEIGHTED_SCORE, decision, tier1Average, lowConfidenceCriteria, autoRedFlag);

  return {
    partner: input,
    criteria,
    totalWeightedScore,
    maxPossibleScore: MAX_WEIGHTED_SCORE,
    normalizedScore,
    tier1Average,
    decision,
    autoRedFlag,
    keyRisks,
    keyUpsides,
    summaryNarrative,
    confidenceBreakdown,
    tierWeights: weights,
  };
}

function buildNarrative(
  input: EvaluationInput,
  criteria: CriterionResult[],
  totalScore: number,
  maxScore: number,
  decision: EvaluationResult["decision"],
  tier1Avg: number,
  lowConf: CriterionResult[],
  autoRed: boolean
): string {
  const partnerName = input.partnerName || "This partner";
  const decisionLabel = decision === "Greenlight" ? "a strong Greenlight" : decision === "Conditional" ? "a Conditional opportunity" : "a Pass";

  const tier1Names = criteria.filter((c) => c.tier === 1);
  const weakTier1 = tier1Names.filter((c) => c.score <= 2);
  const strongTier1 = tier1Names.filter((c) => c.score >= 4);

  let narrative = `${partnerName} scores ${totalScore}/${maxScore} and is rated ${decisionLabel}. `;

  if (autoRed) {
    const blocked = tier1Names.filter((c) => c.score === 1).map((c) => c.label).join(" and ");
    narrative += `A deal-breaker score was recorded in ${blocked}, triggering an automatic deprioritization regardless of other scores. `;
  } else if (decision === "Greenlight") {
    narrative += `Tier 1 fundamentals are strong (average ${tier1Avg.toFixed(1)}/5), indicating solid execution readiness, partner activation, and SaaS conversion potential. `;
  } else if (decision === "Conditional") {
    if (weakTier1.length > 0) {
      narrative += `Tier 1 gaps in ${weakTier1.map((c) => c.label).join(" and ")} present material risks that require explicit mitigation before pursuing. `;
    } else {
      narrative += `While Tier 1 criteria are adequate (average ${tier1Avg.toFixed(1)}/5), conditional gaps in supporting criteria need to be addressed. `;
    }
  } else {
    narrative += `Multiple critical gaps prevent confident pursuit at this time. `;
  }

  if (lowConf.length > 0) {
    const names = lowConf.slice(0, 3).map((c) => c.label).join(", ");
    narrative += `Confidence is limited in ${names}${lowConf.length > 3 ? ` and ${lowConf.length - 3} others` : ""}, meaning these scores carry uncertainty and should be validated before final decisions. `;
  }

  if (strongTier1.length === tier1Names.length && decision !== "Pass") {
    narrative += `All Tier 1 criteria reflect strong conviction, supporting active pipeline prioritization.`;
  }

  return narrative.trim();
}
