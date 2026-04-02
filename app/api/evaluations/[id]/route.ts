import { Pool } from "pg";
import { NextRequest, NextResponse } from "next/server";
import type { EvaluationResult } from "@/lib/rubric";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/evaluations/[id] — fetch a single evaluation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM evaluations WHERE id = $1",
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      partner_name: row.partner_name,
      input_data: row.input_data,
      result_data: row.result_data,
      tier_weights: row.tier_weights,
      decision: row.decision,
      total_score: row.total_score,
      max_score: row.max_score,
      normalized_score: row.normalized_score,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (error) {
    console.error("[v0] Failed to fetch evaluation:", error);
    return NextResponse.json({ error: "Failed to fetch evaluation" }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT /api/evaluations/[id] — update an evaluation
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  try {
    const result: EvaluationResult = await req.json();

    const updated = await client.query(
      `UPDATE evaluations
       SET
         partner_name = $1,
         input_data = $2,
         result_data = $3,
         tier_weights = $4,
         decision = $5,
         total_score = $6,
         max_score = $7,
         normalized_score = $8,
         updated_at = NOW()
       WHERE id = $9
       RETURNING id, partner_name, updated_at`,
      [
        result.partner.partnerName || "Unknown",
        JSON.stringify(result.partner),
        JSON.stringify(result),
        JSON.stringify(result.tierWeights),
        result.decision,
        result.totalWeightedScore,
        result.maxPossibleScore,
        result.normalizedScore,
        params.id,
      ]
    );

    if (updated.rows.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    return NextResponse.json(updated.rows[0]);
  } catch (error) {
    console.error("[v0] Failed to update evaluation:", error);
    return NextResponse.json({ error: "Failed to update evaluation" }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE /api/evaluations/[id] — delete an evaluation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  try {
    const deleted = await client.query(
      "DELETE FROM evaluations WHERE id = $1 RETURNING id",
      [params.id]
    );

    if (deleted.rows.length === 0) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    return NextResponse.json({ id: params.id });
  } catch (error) {
    console.error("[v0] Failed to delete evaluation:", error);
    return NextResponse.json({ error: "Failed to delete evaluation" }, { status: 500 });
  } finally {
    client.release();
  }
}
