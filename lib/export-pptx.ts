import type { EvaluationResult, CriterionResult } from "@/lib/rubric";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// EMU = English Metric Units. 1 inch = 914400 EMU
const IN = 914400;
const W_IN = 13.33;
const H_IN = 7.5;
const W = Math.round(W_IN * IN);
const H = Math.round(H_IN * IN);

function x(inches: number) { return Math.round(inches * IN); }
function y(inches: number) { return Math.round(inches * IN); }
function w(inches: number) { return Math.round(inches * IN); }
function h(inches: number) { return Math.round(inches * IN); }
function pt(points: number) { return Math.round(points * 12700); } // 1pt = 12700 EMU

// Colors (6-digit hex, no #)
const C = {
  bg:        "0D1117",
  card:      "161B22",
  cardAlt:   "1C2330",
  border:    "30363D",
  fg:        "F0F6FC",
  muted:     "8B949E",
  blue:      "58A6FF",
  green:     "3FB950",
  yellow:    "D29922",
  red:       "F85149",
  white:     "FFFFFF",
};

function decisionColor(d: EvaluationResult["decision"]) {
  return d === "Greenlight" ? C.green : d === "Conditional" ? C.yellow : C.red;
}
function scoreColor(s: number) {
  return s >= 4 ? C.green : s === 3 ? C.yellow : C.red;
}
function confColor(c: string) {
  return c === "H" ? C.green : c === "M" ? C.yellow : c === "L" ? C.red : C.muted;
}
function tierColor(t: 1 | 2 | 3) {
  return t === 1 ? C.red : t === 2 ? C.yellow : C.blue;
}

// ─── XML building blocks ──────────────────────────────────────────────────────

function solidFill(hex: string) {
  return `<a:solidFill><a:srgbClr val="${hex}"/></a:solidFill>`;
}

function spPr(
  xv: number, yv: number, wv: number, hv: number,
  opts: { fill?: string; line?: string; lineW?: number; rounding?: number } = {}
) {
  const fill = opts.fill ? solidFill(opts.fill) : "<a:noFill/>";
  const lineW = opts.lineW ?? 9525;
  const line = opts.line
    ? `<a:ln w="${lineW}">${solidFill(opts.line)}</a:ln>`
    : "<a:ln><a:noFill/></a:ln>";
  const round = opts.rounding
    ? `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${opts.rounding}"/></a:avLst></a:prstGeom>`
    : `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>`;
  return `<p:spPr>
    <a:xfrm><a:off x="${xv}" y="${yv}"/><a:ext cx="${wv}" cy="${hv}"/></a:xfrm>
    ${round}${fill}${line}
  </p:spPr>`;
}

function textRun(text: string, opts: {
  size?: number; bold?: boolean; color?: string; italic?: boolean;
} = {}) {
  const sz = opts.size ? `sz="${opts.size * 100}"` : `sz="900"`;
  const b = opts.bold ? `b="1"` : "";
  const i = opts.italic ? `i="1"` : "";
  const color = opts.color
    ? `<a:solidFill><a:srgbClr val="${opts.color}"/></a:solidFill>`
    : "";
  return `<a:r><a:rPr lang="en-US" ${sz} ${b} ${i} dirty="0">${color}</a:rPr><a:t>${esc(text)}</a:t></a:r>`;
}

type Align = "l" | "ctr" | "r";

function textBox(
  xv: number, yv: number, wv: number, hv: number,
  runs: string,
  opts: { align?: Align; valign?: "t" | "ctr" | "b"; wrap?: boolean; fill?: string } = {}
) {
  const anchor = opts.valign === "ctr" ? "ctr" : opts.valign === "b" ? "b" : "t";
  const algn = opts.align ?? "l";
  const fill = opts.fill ? solidFill(opts.fill) : "<a:noFill/>";
  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="0" name="tb"/>
      <p:cNvSpPr txBox="1"><a:spLocks noGrp="1"/></p:cNvSpPr>
      <p:nvPr/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm><a:off x="${xv}" y="${yv}"/><a:ext cx="${wv}" cy="${hv}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
      ${fill}
      <a:ln><a:noFill/></a:ln>
    </p:spPr>
    <p:txBody>
      <a:bodyPr wrap="${opts.wrap === false ? "none" : "square"}" anchor="${anchor}"/>
      <a:lstStyle/>
      <a:p><a:pPr algn="${algn}"/>${runs}</a:p>
    </p:txBody>
  </p:sp>`;
}

function rect(
  xv: number, yv: number, wv: number, hv: number,
  opts: { fill?: string; line?: string; lineW?: number; rounding?: number } = {}
) {
  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="0" name="rect"/>
      <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
      <p:nvPr/>
    </p:nvSpPr>
    ${spPr(xv, yv, wv, hv, opts)}
    <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
  </p:sp>`;
}

// A text box with a filled/bordered background shape combined
function labelBox(
  xv: number, yv: number, wv: number, hv: number,
  runs: string,
  shapeOpts: { fill?: string; line?: string; lineW?: number; rounding?: number } = {},
  textOpts: { align?: Align; valign?: "t" | "ctr" | "b" } = {}
) {
  const anchor = textOpts.valign === "ctr" ? "ctr" : textOpts.valign === "b" ? "b" : "t";
  const algn = textOpts.align ?? "l";
  const fill = shapeOpts.fill ? solidFill(shapeOpts.fill) : "<a:noFill/>";
  const lineW = shapeOpts.lineW ?? 9525;
  const line = shapeOpts.line
    ? `<a:ln w="${lineW}">${solidFill(shapeOpts.line)}</a:ln>`
    : "<a:ln><a:noFill/></a:ln>";
  const round = shapeOpts.rounding
    ? `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${shapeOpts.rounding}"/></a:avLst></a:prstGeom>`
    : `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>`;
  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="0" name="lb"/>
      <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
      <p:nvPr/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm><a:off x="${xv}" y="${yv}"/><a:ext cx="${wv}" cy="${hv}"/></a:xfrm>
      ${round}${fill}${line}
    </p:spPr>
    <p:txBody>
      <a:bodyPr wrap="square" anchor="${anchor}" lIns="${pt(4)}" rIns="${pt(4)}" tIns="${pt(2)}" bIns="${pt(2)}"/>
      <a:lstStyle/>
      <a:p><a:pPr algn="${algn}"/>${runs}</a:p>
    </p:txBody>
  </p:sp>`;
}

function slideXml(shapes: string[], bgColor: string = C.bg): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:bg><p:bgPr>${solidFill(bgColor)}<a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm><a:off x="0" y="0"/><a:ext cx="${W}" cy="${H}"/><a:chOff x="0" y="0"/><a:chExt cx="${W}" cy="${H}"/></a:xfrm>
      </p:grpSpPr>
      ${shapes.join("\n")}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

// ─── Header helper used on slides 2–4 ────────────────────────────────────────

function buildHeader(partnerName: string, title: string, subtitle: string): string[] {
  return [
    rect(x(0), y(0), w(W_IN), h(0.55), { fill: C.card, line: C.border, lineW: 6350 }),
    labelBox(x(0.3), y(0.1), w(0.35), h(0.35),
      textRun("S", { size: 11, bold: true, color: C.white }),
      { fill: C.blue, rounding: 5000 }, { align: "ctr", valign: "ctr" }),
    textBox(x(0.72), y(0.12), w(3), h(0.3),
      textRun("SEVN / Partner Evaluator", { size: 8, color: C.muted }),
      { valign: "ctr" }),
    textBox(x(W_IN - 3.5), y(0.1), w(3.2), h(0.35),
      textRun(partnerName, { size: 8, color: C.muted }),
      { align: "r", valign: "ctr" }),
    textBox(x(0.3), y(0.65), w(W_IN - 0.6), h(0.42),
      textRun(title, { size: 16, bold: true, color: C.fg })),
    textBox(x(0.3), y(1.02), w(W_IN - 0.6), h(0.28),
      textRun(subtitle, { size: 9, color: C.muted })),
  ];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function exportToPptx(result: EvaluationResult): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const tierWeights = result.tierWeights ?? { tier1: 3, tier2: 2, tier3: 1 };
  const dc = decisionColor(result.decision);

  // ── Slide 1: Cover / Decision ──────────────────────────────────────────────
  const slide1: string[] = [];

  // Accent stripe
  slide1.push(rect(x(0), y(0), w(0.08), h(H_IN), { fill: dc }));

  // SEVN logo
  slide1.push(labelBox(x(0.3), y(0.35), w(0.5), h(0.5),
    textRun("S", { size: 16, bold: true, color: C.white }),
    { fill: C.blue, rounding: 5000 }, { align: "ctr", valign: "ctr" }));
  slide1.push(textBox(x(0.9), y(0.42), w(5), h(0.35),
    textRun("SEVN Partner Evaluation Framework", { size: 9, color: C.muted }),
    { valign: "ctr" }));

  // Partner name
  slide1.push(textBox(x(0.3), y(1.1), w(W_IN - 0.6), h(1.0),
    textRun(result.partner.partnerName || "Partner", { size: 40, bold: true, color: C.fg })));

  // Meta
  const meta = [result.partner.league, result.partner.venue, result.partner.season].filter(Boolean).join("  ·  ");
  if (meta) {
    slide1.push(textBox(x(0.3), y(2.05), w(W_IN - 0.6), h(0.35),
      textRun(meta, { size: 11, color: C.muted })));
  }

  // Decision badge
  const decLabels = { Greenlight: "GREENLIGHT — Priority, actively pursue", Conditional: "CONDITIONAL — Viable with specific conditions", Pass: "PASS — Deprioritize" };
  slide1.push(labelBox(x(0.3), y(2.55), w(4.5), h(0.55),
    textRun(decLabels[result.decision], { size: 11, bold: true, color: dc }),
    { fill: C.cardAlt, line: dc, lineW: 12700, rounding: 5000 }, { align: "ctr", valign: "ctr" }));

  if (result.autoRedFlag) {
    slide1.push(labelBox(x(5.1), y(2.55), w(3.2), h(0.55),
      textRun("AUTO RED FLAG — Tier 1 score of 1", { size: 9, bold: true, color: C.red }),
      { fill: C.cardAlt, line: C.red, lineW: 12700, rounding: 5000 }, { align: "ctr", valign: "ctr" }));
  }

  // Score number
  slide1.push(textBox(x(0.3), y(3.35), w(2.2), h(1.2),
    textRun(String(result.totalWeightedScore), { size: 60, bold: true, color: dc })));
  slide1.push(textBox(x(2.2), y(4.2), w(1.0), h(0.45),
    textRun(`/${result.maxPossibleScore}`, { size: 16, color: C.muted })));

  // Score bar
  const barTotalW = W_IN - 0.6;
  const pct = Math.min(result.totalWeightedScore / result.maxPossibleScore, 1);
  slide1.push(rect(x(0.3), y(4.85), w(barTotalW), h(0.18), { fill: C.card, line: C.border, lineW: 6350 }));
  if (pct > 0.01) {
    slide1.push(rect(x(0.3), y(4.85), w(barTotalW * pct), h(0.18), { fill: dc }));
  }
  const condX = 0.3 + barTotalW * 0.588;
  const greenX = 0.3 + barTotalW * 0.765;
  slide1.push(textBox(x(0.3), y(5.07), w(1.2), h(0.2), textRun("Pass", { size: 7, color: C.muted })));
  slide1.push(textBox(x(condX - 0.3), y(5.07), w(1.2), h(0.2), textRun("Conditional", { size: 7, color: C.muted }), { align: "ctr" }));
  slide1.push(textBox(x(greenX - 0.3), y(5.07), w(1.2), h(0.2), textRun("Greenlight", { size: 7, color: C.muted }), { align: "r" }));

  // Confidence summary
  const { high, medium, low, total } = result.confidenceBreakdown;
  const unset = total - high - medium - low;
  slide1.push(textBox(x(0.3), y(5.4), w(1.1), h(0.25), textRun("Confidence:", { size: 9, bold: true, color: C.muted })));
  const confItems = [
    { label: `${high} High`, color: C.green },
    { label: `${medium} Med`, color: C.yellow },
    { label: `${low} Low`, color: C.red },
    ...(unset > 0 ? [{ label: `${unset} Unset`, color: C.muted }] : []),
  ];
  confItems.forEach((item, i) => {
    slide1.push(textBox(x(1.5 + i * 1.1), y(5.4), w(1.0), h(0.25), textRun(item.label, { size: 9, bold: true, color: item.color })));
  });

  // Tier weights
  slide1.push(textBox(x(0.3), y(5.7), w(W_IN - 0.6), h(0.25),
    textRun(`Weights: Tier 1 = ${tierWeights.tier1}×  |  Tier 2 = ${tierWeights.tier2}×  |  Tier 3 = ${tierWeights.tier3}×  |  Confidence discounts: High = full  ·  Med = −10%  ·  Low = −25%`, { size: 8, color: C.muted })));

  // Date
  slide1.push(textBox(x(W_IN - 2.5), y(H_IN - 0.4), w(2.2), h(0.25),
    textRun(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), { size: 8, color: C.muted }), { align: "r" }));

  // ── Slide 2: Evaluation Summary ────────────────────────────────────────────
  const slide2: string[] = buildHeader(result.partner.partnerName || "Partner", "Evaluation Summary", result.partner.partnerName || "");

  // Narrative box
  slide2.push(labelBox(x(0.3), y(1.45), w(W_IN - 0.6), h(1.5),
    textRun(result.summaryNarrative, { size: 10, color: C.fg }),
    { fill: C.card, line: C.border, lineW: 6350, rounding: 3000 }, { valign: "t" }));

  // Risks & Upside columns
  const colW = (W_IN - 0.9) / 2;
  const riskX = 0.3;
  const upsideX = 0.3 + colW + 0.3;
  const tableY = 3.1;

  slide2.push(labelBox(x(riskX), y(tableY), w(colW), h(0.35),
    textRun("KEY RISKS", { size: 9, bold: true, color: C.red }),
    { fill: C.cardAlt, line: C.red, lineW: 6350, rounding: 3000 }, { valign: "ctr" }));

  if (result.keyRisks.length === 0) {
    slide2.push(textBox(x(riskX), y(tableY + 0.42), w(colW), h(0.4), textRun("No material risks identified.", { size: 9, color: C.muted, italic: true })));
  } else {
    result.keyRisks.slice(0, 5).forEach((r, i) => {
      slide2.push(textBox(x(riskX), y(tableY + 0.42 + i * 0.52), w(colW), h(0.5),
        textRun(`— ${r}`, { size: 9, color: C.fg })));
    });
  }

  slide2.push(labelBox(x(upsideX), y(tableY), w(colW), h(0.35),
    textRun("KEY UPSIDE", { size: 9, bold: true, color: C.green }),
    { fill: C.cardAlt, line: C.green, lineW: 6350, rounding: 3000 }, { valign: "ctr" }));

  if (result.keyUpsides.length === 0) {
    slide2.push(textBox(x(upsideX), y(tableY + 0.42), w(colW), h(0.4), textRun("No strong upsides recorded.", { size: 9, color: C.muted, italic: true })));
  } else {
    result.keyUpsides.slice(0, 5).forEach((u, i) => {
      slide2.push(textBox(x(upsideX), y(tableY + 0.42 + i * 0.52), w(colW), h(0.5),
        textRun(`+ ${u}`, { size: 9, color: C.fg })));
    });
  }

  // ── Slide 3: Full Scorecard ────────────────────────────────────────────────
  const slide3: string[] = buildHeader(
    result.partner.partnerName || "Partner",
    "Full Scorecard",
    `Total: ${result.totalWeightedScore} / ${result.maxPossibleScore}  ·  Confidence: High=full  ·  Med=−10%  ·  Low=−25%`
  );

  const tiers: Array<{ tier: 1 | 2 | 3; label: string }> = [
    { tier: 1, label: "Tier 1 — Execution & Monetization Foundation" },
    { tier: 2, label: "Tier 2 — Value Creation & Network Building" },
    { tier: 3, label: "Tier 3 — Operational Feasibility" },
  ];

  let curY = 1.38;
  const cols = { label: 3.4, score: 0.55, conf: 0.65, raw: 0.65, eff: 0.65, notes: 0 };
  cols.notes = W_IN - 0.6 - cols.label - cols.score - cols.conf - cols.raw - cols.eff - 0.1;
  const colX = {
    label: 0.3,
    score: 0.3 + cols.label,
    conf:  0.3 + cols.label + cols.score,
    raw:   0.3 + cols.label + cols.score + cols.conf,
    eff:   0.3 + cols.label + cols.score + cols.conf + cols.raw,
    notes: 0.3 + cols.label + cols.score + cols.conf + cols.raw + cols.eff + 0.05,
  };

  for (const { tier, label } of tiers) {
    const tc = tierColor(tier);
    const tierCriteria = result.criteria.filter((c) => c.tier === tier);
    const tierTotal = Math.round(tierCriteria.reduce((s, c) => s + c.weightedScore, 0) * 10) / 10;
    const tierMax = tierCriteria.reduce((s, c) => s + 5 * c.weight, 0);

    // Tier header
    slide3.push(labelBox(x(0.3), y(curY), w(W_IN - 0.6), h(0.28),
      textRun(label, { size: 8, bold: true, color: tc }),
      { fill: C.cardAlt, line: tc, lineW: 6350, rounding: 3000 }, { valign: "ctr" }));
    slide3.push(textBox(x(W_IN - 1.5), y(curY), w(1.15), h(0.28),
      textRun(`${tierTotal}/${tierMax}`, { size: 8, bold: true, color: tc }), { align: "r", valign: "ctr" }));
    curY += 0.31;

    // Column headers
    slide3.push(textBox(x(colX.label), y(curY), w(cols.label), h(0.2), textRun("Criterion", { size: 7, bold: true, color: C.muted })));
    slide3.push(textBox(x(colX.score), y(curY), w(cols.score), h(0.2), textRun("Score", { size: 7, bold: true, color: C.muted }), { align: "ctr" }));
    slide3.push(textBox(x(colX.conf), y(curY), w(cols.conf), h(0.2), textRun("Conf.", { size: 7, bold: true, color: C.muted }), { align: "ctr" }));
    slide3.push(textBox(x(colX.raw), y(curY), w(cols.raw), h(0.2), textRun("Raw pts", { size: 7, bold: true, color: C.muted }), { align: "ctr" }));
    slide3.push(textBox(x(colX.eff), y(curY), w(cols.eff), h(0.2), textRun("Eff. pts", { size: 7, bold: true, color: C.muted }), { align: "ctr" }));
    slide3.push(textBox(x(colX.notes), y(curY), w(cols.notes), h(0.2), textRun("Notes / Validation", { size: 7, bold: true, color: C.muted })));
    curY += 0.22;

    for (const c of tierCriteria) {
      const rh = 0.34;
      const sc = scoreColor(c.score);
      const cc = confColor(c.confidence ?? "");
      const noteText = [c.notes, c.validationNeeded ? `Val: ${c.validationNeeded}` : ""].filter(Boolean).join("  |  ");

      slide3.push(rect(x(0.3), y(curY), w(W_IN - 0.6), h(rh), { fill: C.card, line: C.border, lineW: 4762 }));
      slide3.push(textBox(x(colX.label + 0.08), y(curY + 0.02), w(cols.label - 0.12), h(rh - 0.04), textRun(c.label, { size: 7.5, color: C.fg }), { valign: "ctr" }));
      slide3.push(textBox(x(colX.score), y(curY), w(cols.score), h(rh), textRun(`${c.score}/5`, { size: 8, bold: true, color: sc }), { align: "ctr", valign: "ctr" }));
      slide3.push(textBox(x(colX.conf), y(curY), w(cols.conf), h(rh), textRun(c.confidence || "—", { size: 8, bold: true, color: cc }), { align: "ctr", valign: "ctr" }));
      slide3.push(textBox(x(colX.raw), y(curY), w(cols.raw), h(rh), textRun(String(c.rawWeightedScore), { size: 8, color: C.muted }), { align: "ctr", valign: "ctr" }));
      slide3.push(textBox(x(colX.eff), y(curY), w(cols.eff), h(rh), textRun(String(c.weightedScore), { size: 8, bold: true, color: C.fg }), { align: "ctr", valign: "ctr" }));
      slide3.push(textBox(x(colX.notes), y(curY + 0.02), w(cols.notes), h(rh - 0.04), textRun(noteText, { size: 7, color: C.muted }), { valign: "ctr" }));

      curY += rh + 0.04;
    }
    curY += 0.1;
  }

  // ── Slide 4: Notes & Validation ───────────────────────────────────────────
  const criteriaWithNotes = result.criteria.filter((c) => c.notes || c.validationNeeded);
  const slide4: string[] = buildHeader(result.partner.partnerName || "Partner", "Criterion Notes & Validation Gaps", "");

  if (criteriaWithNotes.length === 0) {
    slide4.push(textBox(x(0.3), y(2.0), w(W_IN - 0.6), h(0.5), textRun("No notes or validation items were recorded.", { size: 11, color: C.muted, italic: true }), { valign: "ctr" }));
  } else {
    const noteColW = (W_IN - 0.9) / 2;
    let noteY = 1.42;
    criteriaWithNotes.forEach((c, i) => {
      const col = i % 2;
      const nx = 0.3 + col * (noteColW + 0.3);
      if (col === 0 && i > 0) noteY += 1.08;
      const tc = tierColor(c.tier);

      slide4.push(rect(x(nx), y(noteY), w(noteColW), h(1.0), { fill: C.card, line: C.border, lineW: 6350, rounding: 3000 }));
      slide4.push(rect(x(nx), y(noteY), w(0.06), h(1.0), { fill: tc, rounding: 3000 }));
      slide4.push(textBox(x(nx + 0.14), y(noteY + 0.06), w(noteColW - 0.4), h(0.26), textRun(c.label, { size: 8.5, bold: true, color: C.fg })));
      slide4.push(textBox(x(nx + 0.14), y(noteY + 0.3), w(noteColW - 0.2), h(0.18),
        textRun(`Score ${c.score}/5  ·  ${c.confidence || "—"} conf  ·  raw ${c.rawWeightedScore} → eff ${c.weightedScore} pts`, { size: 7, color: C.muted })));
      if (c.notes) {
        slide4.push(textBox(x(nx + 0.14), y(noteY + 0.48), w(noteColW - 0.2), h(0.25), textRun(c.notes, { size: 8, color: C.fg })));
      }
      if (c.validationNeeded) {
        slide4.push(textBox(x(nx + 0.14), y(noteY + (c.notes ? 0.72 : 0.48)), w(noteColW - 0.2), h(0.22),
          textRun(`Validation needed: ${c.validationNeeded}`, { size: 7.5, color: C.yellow, italic: true })));
      }
    });
  }

  // ── Assemble ZIP ──────────────────────────────────────────────────────────

  const slideXmls = [slide1, slide2, slide3, slide4].map((shapes, i) =>
    slideXml(shapes)
  );

  const slideCount = slideXmls.length;
  const slideRels = slideXmls.map((_, i) => `
    <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
        Target="../slideLayouts/slideLayout1.xml"/>
    </Relationships>`);

  // Presentation relationships
  const slideRelItems = Array.from({ length: slideCount }, (_, i) =>
    `<Relationship Id="rId${i + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
  ).join("\n");

  const slideListItems = Array.from({ length: slideCount }, (_, i) =>
    `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`
  ).join("\n");

  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  saveSubsetFonts="1">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldSz cx="${W}" cy="${H}" type="custom"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:sldIdLst>${slideListItems}</p:sldIdLst>
</p:presentation>`;

  const presRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  ${slideRelItems}
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${Array.from({ length: slideCount }, (_, i) =>
    `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join("\n  ")}
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;

  const dotRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

  // Minimal slide master (required by spec)
  const slideMasterXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle><a:lstStyle/></p:titleStyle>
    <p:bodyStyle><a:lstStyle/></p:bodyStyle>
    <p:otherStyle><a:lstStyle/></p:otherStyle>
  </p:txStyles>
</p:sldMaster>`;

  const slideMasterRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

  const slideLayoutXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;

  const slideLayoutRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

  const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SEVN">
  <a:themeElements>
    <a:clrScheme name="SEVN">
      <a:dk1><a:srgbClr val="${C.fg}"/></a:dk1>
      <a:lt1><a:srgbClr val="${C.bg}"/></a:lt1>
      <a:dk2><a:srgbClr val="${C.muted}"/></a:dk2>
      <a:lt2><a:srgbClr val="${C.card}"/></a:lt2>
      <a:accent1><a:srgbClr val="${C.blue}"/></a:accent1>
      <a:accent2><a:srgbClr val="${C.green}"/></a:accent2>
      <a:accent3><a:srgbClr val="${C.yellow}"/></a:accent3>
      <a:accent4><a:srgbClr val="${C.red}"/></a:accent4>
      <a:accent5><a:srgbClr val="${C.blue}"/></a:accent5>
      <a:accent6><a:srgbClr val="${C.blue}"/></a:accent6>
      <a:hlink><a:srgbClr val="${C.blue}"/></a:hlink>
      <a:folHlink><a:srgbClr val="${C.muted}"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="SEVN">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="SEVN">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;

  // ── Build zip ─────────────────────────────────────────────────────────────
  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", dotRels);
  zip.file("ppt/presentation.xml", presentationXml);
  zip.file("ppt/_rels/presentation.xml.rels", presRels);
  zip.file("ppt/theme/theme1.xml", themeXml);
  zip.file("ppt/slideMasters/slideMaster1.xml", slideMasterXml);
  zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", slideMasterRels);
  zip.file("ppt/slideLayouts/slideLayout1.xml", slideLayoutXml);
  zip.file("ppt/slideLayouts/_rels/slideLayout1.xml.rels", slideLayoutRels);

  slideXmls.forEach((xml, i) => {
    zip.file(`ppt/slides/slide${i + 1}.xml`, xml);
    zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`, slideRels[i]);
  });

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SEVN_${(result.partner.partnerName || "Partner").replace(/\s+/g, "_")}_Evaluation.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
