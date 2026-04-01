import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";
import type { EvaluationResult } from "@/lib/rubric";

// GET /api/evaluations/[id] — fetch a single evaluation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await sql`
      SELECT * FROM evaluations WHERE id = ${params.id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      partner_name: row.partner_name,
      decision: row.decision,
      total_weighted_score: row.total_weighted_score,
      max_possible_score: row.max_possible_score,
      normalized_score: row.normalized_score,
      tier1_weight: row.tier1_weight,
      tier2_weight: row.tier2_weight,
      tier3_weight: row.tier3_weight,
      criteria_data: row.criteria_data,
      key_risks: row.key_risks,
      key_upsides: row.key_upsides,
      summary_narrative: row.summary_narrative,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (error) {
    console.error("[v0] Failed to fetch evaluation:", error);
    return NextResponse.json({ error: "Failed to fetch evaluation" }, { status: 500 });
  }
}

// PUT /api/evaluations/[id] — update an evaluation
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result: EvaluationResult = await req.json();

    const updated = await sql`
      UPDATE evaluations
      SET
        partner_name = ${result.partner.partnerName || "Unknown"},
        decision = ${result.decision},
        total_weighted_score = ${result.totalWeightedScore},
        normalized_score = ${result.normalizedScore},
        tier1_weight = ${result.tierWeights?.tier1 ?? 3},
        tier2_weight = ${result.tierWeights?.tier2 ?? 2},
        tier3_weight = ${result.tierWeights?.tier3 ?? 1},
        criteria_data = ${JSON.stringify(result.criteria)},
        key_risks = ${result.keyRisks},
        key_upsides = ${result.keyUpsides},
        summary_narrative = ${result.summaryNarrative},
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING id, partner_name, updated_at
    `;

    if (updated.rows.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    return NextResponse.json(updated.rows[0]);
  } catch (error) {
    console.error("[v0] Failed to update evaluation:", error);
    return NextResponse.json({ error: "Failed to update evaluation" }, { status: 500 });
  }
}

// DELETE /api/evaluations/[id] — delete an evaluation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await sql`
      DELETE FROM evaluations WHERE id = ${params.id}
      RETURNING id
    `;

    if (deleted.rows.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    return NextResponse.json({ id: params.id });
  } catch (error) {
    console.error("[v0] Failed to delete evaluation:", error);
    return NextResponse.json({ error: "Failed to delete evaluation" }, { status: 500 });
  }
}
