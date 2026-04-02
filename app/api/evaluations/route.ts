import { Pool } from "pg";
import { NextRequest, NextResponse } from "next/server";
import type { EvaluationResult } from "@/lib/rubric";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/evaluations — list all evaluations
export async function GET(req: NextRequest) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        id,
        partner_name,
        decision,
        total_score,
        normalized_score,
        created_at,
        updated_at
      FROM evaluations
      ORDER BY created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("[v0] Failed to list evaluations:", error);
    return NextResponse.json({ error: "Failed to list evaluations" }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST /api/evaluations — save a new evaluation
export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const result: EvaluationResult = await req.json();

    const inserted = await client.query(
      `INSERT INTO evaluations (
        partner_name,
        input_data,
        result_data,
        tier_weights,
        decision,
        total_score,
        max_score,
        normalized_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, partner_name, created_at`,
      [
        result.partner.partnerName || "Unknown",
        JSON.stringify(result.partner),
        JSON.stringify(result),
        JSON.stringify(result.tierWeights),
        result.decision,
        result.totalWeightedScore,
        result.maxPossibleScore,
        result.normalizedScore,
      ]
    );

    return NextResponse.json(inserted.rows[0]);
  } catch (error) {
    console.error("[v0] Failed to save evaluation:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  } finally {
    client.release();
  }
}
