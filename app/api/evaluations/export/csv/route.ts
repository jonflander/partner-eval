import { Pool } from "pg";
import { NextRequest, NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/evaluations/export/csv — export all evaluations as CSV
export async function GET(req: NextRequest) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        id,
        partner_name,
        decision,
        total_score,
        max_score,
        normalized_score,
        tier_weights,
        result_data,
        created_at,
        updated_at
      FROM evaluations
      ORDER BY created_at DESC
    `);

    const rows = result.rows as any[];

    // Build CSV header
    const headers = [
      "ID",
      "Partner Name",
      "Decision",
      "Score",
      "Max Score",
      "Score %",
      "Tier 1 Weight",
      "Tier 2 Weight",
      "Tier 3 Weight",
      "Key Risks",
      "Key Upsides",
      "Created At",
      "Updated At",
    ];

    // Build CSV rows
    const csvRows = rows.map((row) => {
      const tierWeights = row.tier_weights || { tier1: 3, tier2: 2, tier3: 1 };
      const resultData = row.result_data || {};
      const keyRisks = resultData.keyRisks || [];
      const keyUpsides = resultData.keyUpsides || [];

      return [
        row.id,
        `"${(row.partner_name || "").replace(/"/g, '""')}"`, // Escape quotes in names
        row.decision,
        row.total_score,
        row.max_score,
        row.normalized_score,
        tierWeights.tier1,
        tierWeights.tier2,
        tierWeights.tier3,
        `"${(keyRisks.join("; ") || "").replace(/"/g, '""')}"`,
        `"${(keyUpsides.join("; ") || "").replace(/"/g, '""')}"`,
        new Date(row.created_at).toISOString(),
        new Date(row.updated_at).toISOString(),
      ];
    });

    // Combine header and rows
    const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n");

    // Return as CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sevn-evaluations-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("[v0] Failed to export CSV:", error);
    return NextResponse.json({ error: "Failed to export evaluations" }, { status: 500 });
  } finally {
    client.release();
  }
}
