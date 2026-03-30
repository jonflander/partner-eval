import type { EvaluationResult } from "@/lib/rubric";

// Color palette
const COLORS = {
  bg: "0D1117",
  bgCard: "161B22",
  bgCardAlt: "1C2330",
  border: "30363D",
  textPrimary: "F0F6FC",
  textMuted: "8B949E",
  blue: "58A6FF",
  green: "3FB950",
  yellow: "D29922",
  red: "F85149",
  orange: "E3714A",
  white: "FFFFFF",
};

const DECISION_COLOR = {
  Greenlight: COLORS.green,
  Conditional: COLORS.yellow,
  Pass: COLORS.red,
};

function confColor(conf: string) {
  if (conf === "H") return COLORS.green;
  if (conf === "M") return COLORS.yellow;
  if (conf === "L") return COLORS.red;
  return COLORS.textMuted;
}

function scoreColor(score: number) {
  if (score >= 4) return COLORS.green;
  if (score === 3) return COLORS.yellow;
  return COLORS.red;
}

export async function exportToPptx(result: EvaluationResult) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches
  pptx.title = `SEVN Partner Evaluation — ${result.partner.partnerName}`;
  pptx.author = "SEVN Partner Evaluator";

  const W = 13.33;
  const H = 7.5;

  // ─── Helper: slide background ────────────────────────────────
  function addBackground(slide: ReturnType<typeof pptx.addSlide>) {
    slide.background = { color: COLORS.bg };
  }

  function addSlideHeader(
    slide: ReturnType<typeof pptx.addSlide>,
    title: string,
    subtitle?: string
  ) {
    // Top bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: W, h: 0.55,
      fill: { color: COLORS.bgCard },
      line: { color: COLORS.border, width: 0.5 },
    });
    // SEVN logo area
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.3, y: 0.1, w: 0.35, h: 0.35,
      fill: { color: COLORS.blue },
      rectRadius: 0.05,
    });
    slide.addText("S", {
      x: 0.3, y: 0.1, w: 0.35, h: 0.35,
      fontSize: 11, bold: true, color: COLORS.white, align: "center", valign: "middle",
    });
    slide.addText("SEVN / Partner Evaluator", {
      x: 0.72, y: 0.12, w: 3, h: 0.3,
      fontSize: 9, color: COLORS.textMuted, valign: "middle",
    });
    // Right: partner name
    slide.addText(result.partner.partnerName || "Partner", {
      x: W - 3.5, y: 0.1, w: 3.2, h: 0.35,
      fontSize: 9, color: COLORS.textMuted, align: "right", valign: "middle",
    });
    // Slide title
    slide.addText(title, {
      x: 0.3, y: 0.65, w: W - 0.6, h: 0.42,
      fontSize: 16, bold: true, color: COLORS.textPrimary,
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.3, y: 1.02, w: W - 0.6, h: 0.28,
        fontSize: 10, color: COLORS.textMuted,
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // SLIDE 1 — Cover / Decision
  // ═══════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    addBackground(slide);

    const decColor = DECISION_COLOR[result.decision];

    // Full-height accent stripe
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 0.08, h: H,
      fill: { color: decColor },
    });

    // SEVN logo
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.3, y: 0.35, w: 0.5, h: 0.5,
      fill: { color: COLORS.blue }, rectRadius: 0.06,
    });
    slide.addText("S", {
      x: 0.3, y: 0.35, w: 0.5, h: 0.5,
      fontSize: 16, bold: true, color: COLORS.white, align: "center", valign: "middle",
    });
    slide.addText("SEVN Partner Evaluation Framework", {
      x: 0.9, y: 0.42, w: 5, h: 0.35,
      fontSize: 10, color: COLORS.textMuted, valign: "middle",
    });

    // Partner name
    slide.addText(result.partner.partnerName || "Partner", {
      x: 0.3, y: 1.1, w: W - 0.6, h: 1.1,
      fontSize: 42, bold: true, color: COLORS.textPrimary,
    });

    // Meta: league · venue · season
    const metaParts = [result.partner.league, result.partner.venue, result.partner.season].filter(Boolean);
    if (metaParts.length > 0) {
      slide.addText(metaParts.join("  ·  "), {
        x: 0.3, y: 2.1, w: W - 0.6, h: 0.35,
        fontSize: 12, color: COLORS.textMuted,
      });
    }

    // Decision badge
    const decLabels = {
      Greenlight: "GREENLIGHT — Priority, actively pursue",
      Conditional: "CONDITIONAL — Viable with specific conditions",
      Pass: "PASS — Deprioritize",
    };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.3, y: 2.6, w: 4.5, h: 0.55,
      fill: { color: COLORS.bgCardAlt },
      line: { color: decColor, width: 1 },
      rectRadius: 0.08,
    });
    slide.addText(decLabels[result.decision], {
      x: 0.3, y: 2.6, w: 4.5, h: 0.55,
      fontSize: 11, bold: true, color: decColor, align: "center", valign: "middle",
    });

    if (result.autoRedFlag) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 5.1, y: 2.6, w: 3.2, h: 0.55,
        fill: { color: COLORS.bgCardAlt },
        line: { color: COLORS.red, width: 1 },
        rectRadius: 0.08,
      });
      slide.addText("AUTO RED FLAG — Tier 1 score of 1", {
        x: 5.1, y: 2.6, w: 3.2, h: 0.55,
        fontSize: 9, bold: true, color: COLORS.red, align: "center", valign: "middle",
      });
    }

    // Score display
    const pct = Math.min((result.totalWeightedScore / result.maxPossibleScore) * 100, 100);
    slide.addText(`${result.totalWeightedScore}`, {
      x: 0.3, y: 3.4, w: 2, h: 1.3,
      fontSize: 72, bold: true, color: decColor,
    });
    slide.addText(`/${result.maxPossibleScore}`, {
      x: 2.0, y: 4.2, w: 1, h: 0.5,
      fontSize: 18, color: COLORS.textMuted,
    });

    // Score bar background
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.3, y: 4.85, w: W - 0.6, h: 0.18,
      fill: { color: COLORS.bgCard },
      line: { color: COLORS.border, width: 0.5 },
      rectRadius: 0.09,
    });
    // Score bar fill
    const barW = ((W - 0.6) * pct) / 100;
    if (barW > 0.1) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.3, y: 4.85, w: barW, h: 0.18,
        fill: { color: decColor },
        rectRadius: 0.09,
      });
    }
    // Threshold markers
    const passX = 0.3 + (W - 0.6) * 0;
    const condX = 0.3 + (W - 0.6) * (result.maxPossibleScore * 0.588 / result.maxPossibleScore);
    const greenX = 0.3 + (W - 0.6) * (result.maxPossibleScore * 0.765 / result.maxPossibleScore);
    slide.addText("Pass", { x: passX, y: 5.08, w: 1, h: 0.2, fontSize: 7, color: COLORS.textMuted });
    slide.addText("Conditional", { x: condX - 0.3, y: 5.08, w: 1.2, h: 0.2, fontSize: 7, color: COLORS.textMuted, align: "center" });
    slide.addText("Greenlight", { x: greenX - 0.3, y: 5.08, w: 1.2, h: 0.2, fontSize: 7, color: COLORS.textMuted, align: "center" });

    // Confidence summary
    const { high, medium, low, total } = result.confidenceBreakdown;
    const unset = total - high - medium - low;
    slide.addText("Confidence:", {
      x: 0.3, y: 5.45, w: 1.2, h: 0.25, fontSize: 9, color: COLORS.textMuted, bold: true,
    });
    const confItems = [
      { label: `${high} High`, color: COLORS.green },
      { label: `${medium} Med`, color: COLORS.yellow },
      { label: `${low} Low`, color: COLORS.red },
      ...(unset > 0 ? [{ label: `${unset} Unset`, color: COLORS.textMuted }] : []),
    ];
    confItems.forEach((item, i) => {
      slide.addText(item.label, {
        x: 1.55 + i * 1.1, y: 5.45, w: 1, h: 0.25,
        fontSize: 9, color: item.color, bold: true,
      });
    });

    // Tier weights info
    const tw = result.tierWeights;
    slide.addText(`Weights: Tier 1 = ${tw.tier1}×  |  Tier 2 = ${tw.tier2}×  |  Tier 3 = ${tw.tier3}×`, {
      x: 0.3, y: 5.75, w: W - 0.6, h: 0.25,
      fontSize: 8, color: COLORS.textMuted,
    });

    // Date
    slide.addText(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), {
      x: W - 2.5, y: H - 0.4, w: 2.2, h: 0.25,
      fontSize: 8, color: COLORS.textMuted, align: "right",
    });
  }

  // ═══════════════════════════════════════════════════════
  // SLIDE 2 — Evaluation Summary
  // ═══════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addSlideHeader(slide, "Evaluation Summary", result.partner.partnerName);

    const narrativeY = 1.45;
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.3, y: narrativeY, w: W - 0.6, h: 1.5,
      fill: { color: COLORS.bgCard },
      line: { color: COLORS.border, width: 0.5 },
      rectRadius: 0.08,
    });
    slide.addText(result.summaryNarrative, {
      x: 0.55, y: narrativeY + 0.1, w: W - 1.1, h: 1.3,
      fontSize: 11, color: COLORS.textPrimary, valign: "top", wrap: true,
      paraSpaceAfter: 4,
    });

    // Risks & Upside two-column
    const colW = (W - 0.9) / 2;
    const riskX = 0.3;
    const upsideX = 0.3 + colW + 0.3;
    const tableY = 3.1;

    // Risk header
    slide.addShape(pptx.ShapeType.rect, {
      x: riskX, y: tableY, w: colW, h: 0.35,
      fill: { color: COLORS.bgCardAlt },
      line: { color: COLORS.red, width: 0.5 },
      rectRadius: 0.06,
    });
    slide.addText("KEY RISKS", {
      x: riskX + 0.1, y: tableY, w: colW - 0.2, h: 0.35,
      fontSize: 9, bold: true, color: COLORS.red, valign: "middle",
    });

    result.keyRisks.slice(0, 5).forEach((r, i) => {
      slide.addText(`— ${r}`, {
        x: riskX, y: tableY + 0.4 + i * 0.52, w: colW, h: 0.5,
        fontSize: 9, color: COLORS.textPrimary, wrap: true,
        bullet: false,
      });
    });
    if (result.keyRisks.length === 0) {
      slide.addText("No material risks identified.", {
        x: riskX, y: tableY + 0.4, w: colW, h: 0.4,
        fontSize: 9, color: COLORS.textMuted, italic: true,
      });
    }

    // Upside header
    slide.addShape(pptx.ShapeType.rect, {
      x: upsideX, y: tableY, w: colW, h: 0.35,
      fill: { color: COLORS.bgCardAlt },
      line: { color: COLORS.green, width: 0.5 },
      rectRadius: 0.06,
    });
    slide.addText("KEY UPSIDE", {
      x: upsideX + 0.1, y: tableY, w: colW - 0.2, h: 0.35,
      fontSize: 9, bold: true, color: COLORS.green, valign: "middle",
    });

    result.keyUpsides.slice(0, 5).forEach((u, i) => {
      slide.addText(`+ ${u}`, {
        x: upsideX, y: tableY + 0.4 + i * 0.52, w: colW, h: 0.5,
        fontSize: 9, color: COLORS.textPrimary, wrap: true,
      });
    });
    if (result.keyUpsides.length === 0) {
      slide.addText("No strong upsides recorded.", {
        x: upsideX, y: tableY + 0.4, w: colW, h: 0.4,
        fontSize: 9, color: COLORS.textMuted, italic: true,
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // SLIDE 3 — Full Scorecard
  // ═══════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    addBackground(slide);
    addSlideHeader(slide, "Full Scorecard", `Total: ${result.totalWeightedScore}/${result.maxPossibleScore}`);

    const tiers = [
      { tier: 1 as const, label: "Tier 1 — Execution & Monetization Foundation", color: COLORS.red },
      { tier: 2 as const, label: "Tier 2 — Value Creation & Network Building", color: COLORS.yellow },
      { tier: 3 as const, label: "Tier 3 — Operational Feasibility", color: COLORS.blue },
    ];

    let curY = 1.38;

    for (const { tier, label, color } of tiers) {
      const tierCriteria = result.criteria.filter((c) => c.tier === tier);
      const tierTotal = tierCriteria.reduce((s, c) => s + c.weightedScore, 0);
      const tierMax = tierCriteria.reduce((s, c) => s + 5 * c.weight, 0);

      // Tier header row
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.3, y: curY, w: W - 0.6, h: 0.3,
        fill: { color: COLORS.bgCardAlt },
        line: { color: color, width: 0.5 },
        rectRadius: 0.05,
      });
      slide.addText(label, {
        x: 0.42, y: curY, w: W - 2, h: 0.3,
        fontSize: 8.5, bold: true, color: color, valign: "middle",
      });
      slide.addText(`${tierTotal}/${tierMax}`, {
        x: W - 1.5, y: curY, w: 1.2, h: 0.3,
        fontSize: 8.5, bold: true, color: color, align: "right", valign: "middle",
      });
      curY += 0.33;

      // Column headers
      const cols = { label: 3.5, score: 0.55, conf: 0.7, weighted: 0.75, notes: W - 0.6 - 3.5 - 0.55 - 0.7 - 0.75 - 0.1 };
      slide.addText("Criterion", { x: 0.3, y: curY, w: cols.label, h: 0.22, fontSize: 7, color: COLORS.textMuted, bold: true });
      slide.addText("Score", { x: 0.3 + cols.label, y: curY, w: cols.score, h: 0.22, fontSize: 7, color: COLORS.textMuted, bold: true, align: "center" });
      slide.addText("Conf.", { x: 0.3 + cols.label + cols.score, y: curY, w: cols.conf, h: 0.22, fontSize: 7, color: COLORS.textMuted, bold: true, align: "center" });
      slide.addText("Wtd.", { x: 0.3 + cols.label + cols.score + cols.conf, y: curY, w: cols.weighted, h: 0.22, fontSize: 7, color: COLORS.textMuted, bold: true, align: "center" });
      slide.addText("Notes / Validation", { x: 0.3 + cols.label + cols.score + cols.conf + cols.weighted, y: curY, w: cols.notes, h: 0.22, fontSize: 7, color: COLORS.textMuted, bold: true });
      curY += 0.24;

      // Criterion rows
      for (const c of tierCriteria) {
        const rowH = 0.36;
        const rowBg = COLORS.bgCard;
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.3, y: curY, w: W - 0.6, h: rowH,
          fill: { color: rowBg },
          line: { color: COLORS.border, width: 0.3 },
          rectRadius: 0.04,
        });

        let noteText = "";
        if (c.notes) noteText += c.notes;
        if (c.validationNeeded) noteText += (noteText ? "  |  " : "") + `Val: ${c.validationNeeded}`;

        const sc = scoreColor(c.score);
        const cc = c.confidence ? confColor(c.confidence) : COLORS.textMuted;

        slide.addText(c.label, {
          x: 0.38, y: curY + 0.02, w: cols.label - 0.1, h: rowH - 0.04,
          fontSize: 8, color: COLORS.textPrimary, valign: "middle", wrap: true,
        });
        slide.addText(`${c.score}/5`, {
          x: 0.3 + cols.label, y: curY, w: cols.score, h: rowH,
          fontSize: 9, bold: true, color: sc, align: "center", valign: "middle",
        });
        slide.addText(c.confidence || "—", {
          x: 0.3 + cols.label + cols.score, y: curY, w: cols.conf, h: rowH,
          fontSize: 8, bold: true, color: cc, align: "center", valign: "middle",
        });
        slide.addText(`${c.weightedScore}`, {
          x: 0.3 + cols.label + cols.score + cols.conf, y: curY, w: cols.weighted, h: rowH,
          fontSize: 9, bold: true, color: COLORS.textPrimary, align: "center", valign: "middle",
        });
        slide.addText(noteText || "", {
          x: 0.3 + cols.label + cols.score + cols.conf + cols.weighted + 0.05, y: curY + 0.02, w: cols.notes - 0.1, h: rowH - 0.04,
          fontSize: 7.5, color: COLORS.textMuted, valign: "middle", wrap: true,
        });

        curY += rowH + 0.04;
      }

      curY += 0.1;
    }
  }

  // ═════════════════════════════════���═════════════════════
  // SLIDE 4 — Criterion Deep Dive (notes & validation)
  // ═══════════════════════════════════════════════════════
  {
    const criteriaWithNotes = result.criteria.filter(
      (c) => c.notes || c.validationNeeded
    );

    if (criteriaWithNotes.length > 0) {
      const slide = pptx.addSlide();
      addBackground(slide);
      addSlideHeader(slide, "Criterion Notes & Validation Gaps");

      let curY = 1.38;
      const colW = (W - 0.9) / 2;

      criteriaWithNotes.forEach((c, i) => {
        const col = i % 2;
        const x = 0.3 + col * (colW + 0.3);

        if (col === 0 && i > 0) curY += 1.05;

        const tierColor = c.tier === 1 ? COLORS.red : c.tier === 2 ? COLORS.yellow : COLORS.blue;

        slide.addShape(pptx.ShapeType.rect, {
          x, y: curY, w: colW, h: 1.0,
          fill: { color: COLORS.bgCard },
          line: { color: COLORS.border, width: 0.5 },
          rectRadius: 0.07,
        });
        // Tier accent line
        slide.addShape(pptx.ShapeType.rect, {
          x, y: curY, w: 0.06, h: 1.0,
          fill: { color: tierColor },
          rectRadius: 0.04,
        });

        slide.addText(c.label, {
          x: x + 0.14, y: curY + 0.06, w: colW - 0.4, h: 0.28,
          fontSize: 9, bold: true, color: COLORS.textPrimary, wrap: true,
        });
        slide.addText(`${c.score}/5  ·  ${c.confidence || "—"} conf.  ·  ${c.weightedScore} pts`, {
          x: x + 0.14, y: curY + 0.3, w: colW - 0.4, h: 0.2,
          fontSize: 7.5, color: COLORS.textMuted,
        });

        if (c.notes) {
          slide.addText(c.notes, {
            x: x + 0.14, y: curY + 0.5, w: colW - 0.2, h: 0.25,
            fontSize: 8, color: COLORS.textPrimary, wrap: true,
          });
        }
        if (c.validationNeeded) {
          slide.addText(`Val needed: ${c.validationNeeded}`, {
            x: x + 0.14, y: curY + (c.notes ? 0.73 : 0.5), w: colW - 0.2, h: 0.22,
            fontSize: 7.5, color: COLORS.yellow, wrap: true, italic: true,
          });
        }
      });
    }
  }

  // Save
  const fileName = `SEVN_${(result.partner.partnerName || "Partner").replace(/\s+/g, "_")}_Evaluation.pptx`;
  await pptx.writeFile({ fileName });
}
