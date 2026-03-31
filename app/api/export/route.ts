import { NextRequest, NextResponse } from "next/server";
import type { EvaluationResult } from "@/lib/rubric";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const IN = 914400; // 1 inch in EMU
const W_IN = 13.33;
const H_IN = 7.5;

function ex(inches: number) { return Math.round(inches * IN); }
function pt(points: number) { return Math.round(points * 12700); }

const C = {
  bg:      "0D1117",
  card:    "161B22",
  cardAlt: "1C2330",
  border:  "30363D",
  fg:      "F0F6FC",
  muted:   "8B949E",
  blue:    "58A6FF",
  green:   "3FB950",
  yellow:  "D29922",
  red:     "F85149",
  white:   "FFFFFF",
};

function solidFill(hex: string) {
  return `<a:solidFill><a:srgbClr val="${hex}"/></a:solidFill>`;
}

function spPr(
  xIn: number, yIn: number, wIn: number, hIn: number,
  opts: { fill?: string; line?: string; rounding?: number } = {}
) {
  const lineXml = opts.line
    ? `<a:ln><a:solidFill><a:srgbClr val="${opts.line}"/></a:solidFill></a:ln>`
    : `<a:ln><a:noFill/></a:ln>`;
  const fillXml = opts.fill ? solidFill(opts.fill) : `<a:noFill/>`;
  const round = opts.rounding != null
    ? `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${opts.rounding}"/></a:avLst></a:prstGeom>`
    : `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>`;
  return `<p:spPr>
    <a:xfrm><a:off x="${ex(xIn)}" y="${ex(yIn)}"/><a:ext cx="${ex(wIn)}" cy="${ex(hIn)}"/></a:xfrm>
    ${round}${fillXml}${lineXml}
  </p:spPr>`;
}

function txBody(
  text: string,
  opts: { size?: number; bold?: boolean; color?: string; align?: string; wrap?: boolean } = {}
) {
  const size = pt(opts.size ?? 11);
  const bold = opts.bold ? "b=\"1\"" : "";
  const color = opts.color ? `<a:solidFill><a:srgbClr val="${opts.color}"/></a:solidFill>` : "";
  const align = opts.align ? `algn="${opts.align}"` : "";
  const wrap = opts.wrap === false ? "wrap=\"none\"" : "";
  return `<p:txBody>
    <a:bodyPr ${wrap}/>
    <a:lstStyle/>
    <a:p><a:pPr ${align}/><a:r>
      <a:rPr lang="en-US" sz="${size}" ${bold} dirty="0">${color}</a:rPr>
      <a:t>${esc(text)}</a:t>
    </a:r></a:p>
  </p:txBody>`;
}

function textShape(
  id: number, name: string,
  xIn: number, yIn: number, wIn: number, hIn: number,
  text: string,
  opts: { size?: number; bold?: boolean; color?: string; align?: string; fill?: string; line?: string } = {}
): string {
  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="${id}" name="${name}"/>
      <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
      <p:nvPr/>
    </p:nvSpPr>
    ${spPr(xIn, yIn, wIn, hIn, { fill: opts.fill, line: opts.line })}
    ${txBody(text, { size: opts.size, bold: opts.bold, color: opts.color, align: opts.align })}
  </p:sp>`;
}

function rectShape(
  id: number, name: string,
  xIn: number, yIn: number, wIn: number, hIn: number,
  fill: string, line?: string, rounding?: number
): string {
  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="${id}" name="${name}"/>
      <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
      <p:nvPr/>
    </p:nvSpPr>
    ${spPr(xIn, yIn, wIn, hIn, { fill, line, rounding })}
    <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
  </p:sp>`;
}

function buildSlideXml(shapes: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgPr>${solidFill(C.bg)}<a:effectLst/></p:bgPr></p:bg>
  <p:spTree>
    <p:nvGrpSpPr>
      <p:cNvPr id="1" name=""/>
      <p:cNvGrpSpPr/>
      <p:nvPr/>
    </p:nvGrpSpPr>
    <p:grpSpPr>
      <a:xfrm><a:off x="0" y="0"/><a:ext cx="${ex(W_IN)}" cy="${ex(H_IN)}"/><a:chOff x="0" y="0"/><a:chExt cx="${ex(W_IN)}" cy="${ex(H_IN)}"/></a:xfrm>
    </p:grpSpPr>
    ${shapes.join("\n")}
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function decisionColor(d: EvaluationResult["decision"]) {
  return d === "Greenlight" ? C.green : d === "Conditional" ? C.yellow : C.red;
}
function scoreColor(s: number) { return s >= 4 ? C.green : s === 3 ? C.yellow : C.red; }
function confLabel(c: string) { return c === "H" ? "High" : c === "M" ? "Medium" : c === "L" ? "Low" : "—"; }

// ─── Slide builders ───────────────────────────────────────────────────────────

function buildSlide1(result: EvaluationResult): string {
  const dc = decisionColor(result.decision);
  const tw = result.tierWeights ?? { tier1: 3, tier2: 2, tier3: 1 };
  const shapes: string[] = [];
  let id = 2;

  // Accent stripe
  shapes.push(rectShape(id++, "stripe", 0, 0, 0.08, H_IN, dc));

  // Title area
  shapes.push(textShape(id++, "title", 0.3, 0.3, 8, 0.5,
    "SEVN Partner Evaluation", { size: 22, bold: true, color: C.fg }));
  shapes.push(textShape(id++, "partner", 0.3, 0.85, 8, 0.4,
    result.partner.partnerName || "Unnamed Partner", { size: 16, bold: true, color: C.blue }));
  shapes.push(textShape(id++, "date", 0.3, 1.25, 8, 0.25,
    `Evaluation date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    { size: 9, color: C.muted }));

  // Score box
  shapes.push(rectShape(id++, "score-box", 0.3, 1.7, 3.2, 1.4, C.card, C.border, 8000));
  shapes.push(textShape(id++, "score-label", 0.5, 1.78, 3, 0.25,
    "TOTAL SCORE", { size: 8, color: C.muted }));
  shapes.push(textShape(id++, "score-val", 0.5, 2.0, 2, 0.7,
    String(result.totalWeightedScore), { size: 40, bold: true, color: dc }));
  shapes.push(textShape(id++, "score-max", 1.6, 2.55, 1.5, 0.3,
    `/ ${result.maxPossibleScore}`, { size: 12, color: C.muted }));

  // Decision box
  shapes.push(rectShape(id++, "decision-box", 3.8, 1.7, 4.5, 1.4, C.card, dc, 8000));
  shapes.push(textShape(id++, "decision-label", 4.0, 1.78, 4, 0.25,
    "DECISION", { size: 8, color: C.muted }));
  shapes.push(textShape(id++, "decision-val", 4.0, 2.05, 4, 0.5,
    result.decision.toUpperCase(), { size: 24, bold: true, color: dc }));
  const sublabel = result.decision === "Greenlight"
    ? "Priority — Actively pursue"
    : result.decision === "Conditional"
    ? "Viable with specific conditions"
    : "Deprioritize";
  shapes.push(textShape(id++, "decision-sub", 4.0, 2.6, 4, 0.25,
    sublabel, { size: 9, color: C.muted }));

  // Weights row
  shapes.push(textShape(id++, "weights-label", 0.3, 3.3, 12, 0.25,
    `Tier weights: T1 = ${tw.tier1}×   T2 = ${tw.tier2}×   T3 = ${tw.tier3}×`, { size: 9, color: C.muted }));

  // Narrative
  shapes.push(rectShape(id++, "narr-box", 0.3, 3.65, 12.73, 1.5, C.card, C.border, 6000));
  shapes.push(textShape(id++, "narr-label", 0.55, 3.73, 12, 0.22,
    "SUMMARY", { size: 8, color: C.muted }));
  // Wrap narrative across two text boxes to handle length
  const narr = result.summaryNarrative;
  const half = Math.floor(narr.length / 2);
  const breakAt = narr.indexOf(" ", half);
  shapes.push(textShape(id++, "narr-1", 0.55, 3.95, 12.2, 0.35,
    narr.slice(0, breakAt), { size: 10, color: C.fg }));
  shapes.push(textShape(id++, "narr-2", 0.55, 4.28, 12.2, 0.35,
    narr.slice(breakAt + 1), { size: 10, color: C.fg }));

  // Confidence row
  const cb = result.confidenceBreakdown;
  shapes.push(textShape(id++, "conf-label", 0.3, 5.3, 12, 0.25,
    `Confidence: ${cb.high} High (full) · ${cb.medium} Medium (−10%) · ${cb.low} Low (−25%)`,
    { size: 9, color: C.muted }));

  if (result.autoRedFlag) {
    shapes.push(rectShape(id++, "redflag-box", 0.3, 5.6, 5, 0.4, C.cardAlt, C.red, 6000));
    shapes.push(textShape(id++, "redflag-txt", 0.5, 5.67, 4.8, 0.28,
      "Auto Red Flag: Tier 1 criterion scored 1/5", { size: 9, bold: true, color: C.red }));
  }

  // Footer
  shapes.push(textShape(id++, "footer", 0.3, 7.1, 12, 0.2,
    "SEVN Partner Evaluation Framework — Confidential", { size: 8, color: C.muted }));

  return buildSlideXml(shapes);
}

function buildSlide2(result: EvaluationResult): string {
  const shapes: string[] = [];
  let id = 2;

  shapes.push(rectShape(id++, "stripe", 0, 0, 0.08, H_IN, decisionColor(result.decision)));
  shapes.push(textShape(id++, "title", 0.3, 0.25, 12, 0.4,
    "Risks & Upsides", { size: 18, bold: true, color: C.fg }));

  // Key Risks
  shapes.push(rectShape(id++, "risk-hdr", 0.3, 0.8, 5.9, 0.3, C.cardAlt, C.red, 4000));
  shapes.push(textShape(id++, "risk-hdr-txt", 0.45, 0.83, 5.6, 0.25,
    "KEY RISKS", { size: 9, bold: true, color: C.red }));
  result.keyRisks.slice(0, 6).forEach((risk, i) => {
    shapes.push(rectShape(id++, `risk-${i}`, 0.3, 1.2 + i * 0.48, 5.9, 0.4, C.card, C.border, 4000));
    shapes.push(textShape(id++, `risk-txt-${i}`, 0.5, 1.25 + i * 0.48, 5.6, 0.32,
      risk, { size: 9, color: C.fg }));
  });

  // Key Upsides
  shapes.push(rectShape(id++, "up-hdr", 6.73, 0.8, 6.3, 0.3, C.cardAlt, C.green, 4000));
  shapes.push(textShape(id++, "up-hdr-txt", 6.88, 0.83, 6, 0.25,
    "KEY UPSIDES", { size: 9, bold: true, color: C.green }));
  result.keyUpsides.slice(0, 6).forEach((up, i) => {
    shapes.push(rectShape(id++, `up-${i}`, 6.73, 1.2 + i * 0.48, 6.3, 0.4, C.card, C.border, 4000));
    shapes.push(textShape(id++, `up-txt-${i}`, 6.93, 1.25 + i * 0.48, 6, 0.32,
      up, { size: 9, color: C.fg }));
  });

  shapes.push(textShape(id++, "footer", 0.3, 7.1, 12, 0.2,
    "SEVN Partner Evaluation Framework — Confidential", { size: 8, color: C.muted }));

  return buildSlideXml(shapes);
}

function buildSlide3(result: EvaluationResult): string {
  const shapes: string[] = [];
  let id = 2;
  const tierColors = [C.red, C.yellow, C.blue];

  shapes.push(rectShape(id++, "stripe", 0, 0, 0.08, H_IN, decisionColor(result.decision)));
  shapes.push(textShape(id++, "title", 0.3, 0.22, 12, 0.38,
    "Full Scorecard", { size: 18, bold: true, color: C.fg }));
  shapes.push(textShape(id++, "subtitle", 0.3, 0.62, 12, 0.25,
    "Raw score → confidence discount → effective points", { size: 9, color: C.muted }));

  // Column headers
  const cols = { label: 0.3, raw: 7.2, conf: 8.3, eff: 9.5, tier: 11.0 };
  shapes.push(rectShape(id++, "hdr-bg", 0.3, 1.0, 12.73, 0.3, C.cardAlt, C.border));
  [["Criterion", cols.label], ["Raw pts", cols.raw], ["Confidence", cols.conf], ["Eff. pts", cols.eff], ["Tier", cols.tier]].forEach(([label, xPos]) => {
    shapes.push(textShape(id++, `hdr-${label}`, xPos as number, 1.03, 1.8, 0.25,
      label as string, { size: 8, bold: true, color: C.muted }));
  });

  let row = 0;
  const tierGroups: Record<number, typeof result.criteria> = { 1: [], 2: [], 3: [] };
  result.criteria.forEach(c => tierGroups[c.tier].push(c));

  ([1, 2, 3] as const).forEach((tier) => {
    const tColor = tierColors[tier - 1];
    const group = tierGroups[tier];
    // Tier header row
    shapes.push(rectShape(id++, `tier-hdr-${tier}`, 0.3, 1.38 + row * 0.42, 12.73, 0.28, C.cardAlt, tColor));
    shapes.push(textShape(id++, `tier-lbl-${tier}`, 0.45, 1.4 + row * 0.42, 6, 0.24,
      `TIER ${tier}`, { size: 9, bold: true, color: tColor }));
    row++;

    group.forEach((c) => {
      const rowBg = row % 2 === 0 ? C.card : C.bg;
      shapes.push(rectShape(id++, `row-bg-${c.key}`, 0.3, 1.38 + row * 0.42, 12.73, 0.38, rowBg, C.border));
      shapes.push(textShape(id++, `c-lbl-${c.key}`, 0.45, 1.42 + row * 0.42, 6.7, 0.32,
        c.label, { size: 9, color: C.fg }));
      shapes.push(textShape(id++, `c-raw-${c.key}`, cols.raw, 1.42 + row * 0.42, 1, 0.32,
        `${c.score}/5 × ${c.weight} = ${c.rawWeightedScore}`, { size: 8, color: C.muted }));
      shapes.push(textShape(id++, `c-conf-${c.key}`, cols.conf, 1.42 + row * 0.42, 1.1, 0.32,
        confLabel(c.confidence ?? ""), { size: 9, bold: true, color: scoreColor(c.confidenceMultiplier >= 1 ? 5 : c.confidenceMultiplier >= 0.9 ? 3 : 2) }));
      shapes.push(textShape(id++, `c-eff-${c.key}`, cols.eff, 1.42 + row * 0.42, 1.4, 0.32,
        `${c.weightedScore} pts`, { size: 9, bold: true, color: scoreColor(c.score) }));
      shapes.push(textShape(id++, `c-tier-${c.key}`, cols.tier, 1.42 + row * 0.42, 1.5, 0.32,
        `T${c.tier} ×${c.weight}`, { size: 8, color: tColor }));
      row++;
    });
  });

  // Total row
  shapes.push(rectShape(id++, "total-bg", 0.3, 1.38 + row * 0.42, 12.73, 0.38, C.cardAlt, decisionColor(result.decision)));
  shapes.push(textShape(id++, "total-lbl", 0.45, 1.42 + row * 0.42, 6, 0.32,
    "TOTAL (confidence-adjusted)", { size: 10, bold: true, color: C.fg }));
  shapes.push(textShape(id++, "total-val", cols.eff, 1.42 + row * 0.42, 2.5, 0.32,
    `${result.totalWeightedScore} / ${result.maxPossibleScore}`, { size: 10, bold: true, color: decisionColor(result.decision) }));

  shapes.push(textShape(id++, "footer", 0.3, 7.1, 12, 0.2,
    "SEVN Partner Evaluation Framework — Confidential", { size: 8, color: C.muted }));

  return buildSlideXml(shapes);
}

function buildSlide4(result: EvaluationResult): string {
  const shapes: string[] = [];
  let id = 2;
  const tierColors = [C.red, C.yellow, C.blue];

  shapes.push(rectShape(id++, "stripe", 0, 0, 0.08, H_IN, decisionColor(result.decision)));
  shapes.push(textShape(id++, "title", 0.3, 0.22, 12, 0.38,
    "Notes & Validation Gaps", { size: 18, bold: true, color: C.fg }));

  let col = 0;
  let rowInCol = 0;
  const colXs = [0.3, 4.6, 8.9];
  const colW = 4.0;

  result.criteria.forEach((c) => {
    if (!c.notes && !c.validationNeeded) return;
    const xPos = colXs[col];
    const yPos = 0.85 + rowInCol * 1.4;
    const tColor = tierColors[c.tier - 1];

    shapes.push(rectShape(id++, `note-box-${c.key}`, xPos, yPos, colW, 1.28, C.card, tColor, 4000));
    shapes.push(textShape(id++, `note-lbl-${c.key}`, xPos + 0.15, yPos + 0.06, colW - 0.3, 0.22,
      `T${c.tier} · ${c.label}`, { size: 8, bold: true, color: tColor }));

    if (c.validationNeeded) {
      shapes.push(textShape(id++, `val-${c.key}`, xPos + 0.15, yPos + 0.3, colW - 0.3, 0.22,
        `Validation: ${c.validationNeeded}`, { size: 8, bold: true, color: C.yellow }));
    }
    if (c.notes) {
      shapes.push(textShape(id++, `notes-${c.key}`, xPos + 0.15, yPos + (c.validationNeeded ? 0.55 : 0.3), colW - 0.3, 0.62,
        c.notes, { size: 8, color: C.fg }));
    }

    rowInCol++;
    if (rowInCol >= 4) { col++; rowInCol = 0; }
  });

  shapes.push(textShape(id++, "footer", 0.3, 7.1, 12, 0.2,
    "SEVN Partner Evaluation Framework — Confidential", { size: 8, color: C.muted }));

  return buildSlideXml(shapes);
}

// ─── PPTX package structure ───────────────────────────────────────────────────

function buildPptx(slides: string[]): Record<string, string> {
  const slideRels = slides.map((_, i) => ({
    id: i + 1,
    rId: `rId${i + 1}`,
    path: `ppt/slides/slide${i + 1}.xml`,
    relPath: `../slides/slide${i + 1}.xml`,
  }));

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("\n  ")}
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

  const presentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${slideRels.map(s => `<Relationship Id="${s.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="${s.relPath}"/>`).join("\n  ")}
  <Relationship Id="rId100" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId101" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;

  const slideIds = slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join("\n    ");

  const presentation = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId100"/></p:sldMasterIdLst>
  <p:sldSz cx="${ex(W_IN)}" cy="${ex(H_IN)}" type="custom"/>
  <p:notesSz cx="${ex(7.5)}" cy="${ex(10)}"/>
  <p:sldIdLst>${slideIds}</p:sldIdLst>
</p:presentation>`;

  const slideLayoutRel = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

  const slideMasterRel = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

  const slideLayout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
  <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;

  const slideMaster = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>
  <p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
  <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`;

  const theme = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SEVN">
  <a:themeElements>
    <a:clrScheme name="SEVN">
      <a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="${C.fg}"/></a:dk2><a:lt2><a:srgbClr val="${C.card}"/></a:lt2>
      <a:accent1><a:srgbClr val="${C.blue}"/></a:accent1>
      <a:accent2><a:srgbClr val="${C.green}"/></a:accent2>
      <a:accent3><a:srgbClr val="${C.yellow}"/></a:accent3>
      <a:accent4><a:srgbClr val="${C.red}"/></a:accent4>
      <a:accent5><a:srgbClr val="${C.muted}"/></a:accent5>
      <a:accent6><a:srgbClr val="${C.cardAlt}"/></a:accent6>
      <a:hlink><a:srgbClr val="${C.blue}"/></a:hlink>
      <a:folHlink><a:srgbClr val="${C.blue}"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="SEVN">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="SEVN"><a:fillStyleLst>
      <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
    </a:fillStyleLst>
    <a:lnStyleLst>
      <a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      <a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      <a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
    </a:lnStyleLst>
    <a:effectStyleLst>
      <a:effectStyle><a:effectLst/></a:effectStyle>
      <a:effectStyle><a:effectLst/></a:effectStyle>
      <a:effectStyle><a:effectLst/></a:effectStyle>
    </a:effectStyleLst>
    <a:bgFillStyleLst>
      <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
    </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;

  // Per-slide relationship files (each slide just points to its layout)
  const files: Record<string, string> = {
    "[Content_Types].xml": contentTypes,
    "_rels/.rels": rootRels,
    "ppt/presentation.xml": presentation,
    "ppt/_rels/presentation.xml.rels": presentationRels,
    "ppt/slideLayouts/slideLayout1.xml": slideLayout,
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": slideLayoutRel,
    "ppt/slideMasters/slideMaster1.xml": slideMaster,
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": slideMasterRel,
    "ppt/theme/theme1.xml": theme,
  };

  slides.forEach((xml, i) => {
    files[`ppt/slides/slide${i + 1}.xml`] = xml;
    files[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;
  });

  return files;
}

// ─── API Route Handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const result: EvaluationResult = await req.json();

    const slides = [
      buildSlide1(result),
      buildSlide2(result),
      buildSlide3(result),
      buildSlide4(result),
    ];

    const files = buildPptx(slides);

    // Build the ZIP using JSZip (server-side, no browser-bundle issues)
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content);
    }

    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      compression: "DEFLATE",
    });

    const partnerName = (result.partner?.partnerName || "partner")
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase();
    const filename = `sevn-eval-${partnerName}.pptx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[v0] Export API error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
