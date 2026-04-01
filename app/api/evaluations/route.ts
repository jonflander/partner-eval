import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";
import type { EvaluationResult } from "@/lib/rubric";

// GET /api/evaluations — list all evaluations
export async function GET(req: NextRequest) {
  try {
    const result = await sql`
      SELECT 
        id,
        partner_name,
        decision,
        total_weighted_score,
        normalized_score,
        created_at,
        updated_at
      FROM evaluations
      ORDER BY created_at DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("[v0] Failed to list evaluations:", error);
    return NextResponse.json({ error: "Failed to list evaluations" }, { status: 500 });
  }
}

// POST /api/evaluations — save a new evaluation
export async function POST(req: NextRequest) {
  try {
    const result: EvaluationResult = await req.json();

    const inserted = await sql`
      INSERT INTO evaluations (
        partner_name,
        decision,
        total_weighted_score,
        max_possible_score,
        normalized_score,
        tier1_weight,
        tier2_weight,
        tier3_weight,
        criteria_data,
        key_risks,
        key_upsides,
        summary_narrative
      ) VALUES (
        ${result.partner.partnerName || "Unknown"},
        ${result.decision},
        ${result.totalWeightedScore},
        ${result.maxPossibleScore},
        ${result.normalizedScore},
        ${result.tierWeights?.tier1 ?? 3},
        ${result.tierWeights?.tier2 ?? 2},
        ${result.tierWeights?.tier3 ?? 1},
        ${JSON.stringify(result.criteria)},
        ${result.keyRisks},
        ${result.keyUpsides},
        ${result.summaryNarrative}
      )
      RETURNING id, partner_name, created_at
    `;

    return NextResponse.json(inserted.rows[0]);
  } catch (error) {
    console.error("[v0] Failed to save evaluation:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  }
}
