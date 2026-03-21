import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import {
  buildChecklistPdfModel,
  type ChecklistPdfModel,
  type ChecklistPdfRow
} from "./checklist-pdf-model";
import { getNotoSansCjkJpSubsetBytes } from "./assets/noto-sans-cjk-jp-subset";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const HEADER_TITLE_FONT_SIZE = 25;
const HEADER_META_LABEL_SIZE = 8;
const HEADER_META_VALUE_SIZE = 10;
const BODY_FONT_SIZE = 9;
const BODY_LINE_HEIGHT = 13;
const TITLE_FONT_SIZE = 12;
const TITLE_LINE_HEIGHT = 16;
const SECTION_NUMBER_SIZE = 34;
const SECTION_TITLE_SIZE = 15;
const LABEL_FONT_SIZE = 8;
const LABEL_LINE_HEIGHT = 11;
const INTRO_HEIGHT = 146;
const MEMO_LINE_COUNT = 5;
const CHECKBOX_SIZE = 16;
const ROW_GAP = 16;

const COLOR_PAGE_BG = rgb(0.992, 0.988, 0.984);
const COLOR_TEXT = rgb(0.122, 0.106, 0.094);
const COLOR_MUTED = rgb(0.38, 0.34, 0.3);
const COLOR_SUBTLE = rgb(0.53, 0.45, 0.38);
const COLOR_RULE = rgb(0.82, 0.77, 0.72);
const COLOR_ACCENT = rgb(0.553, 0.455, 0.325);
const COLOR_ACCENT_SOFT = rgb(0.953, 0.925, 0.892);
const COLOR_WHITE = rgb(1, 1, 1);

export { buildChecklistPdfModel };
export type { ChecklistPdfModel };

export async function buildChecklistPdf(model: ChecklistPdfModel): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = getNotoSansCjkJpSubsetBytes();
  const regularFont = await pdf.embedFont(fontBytes);
  const boldFont = regularFont;

  let page = addStyledPage(pdf);
  let cursorY = PAGE_HEIGHT - PAGE_MARGIN;

  cursorY = drawDocumentHeader(page, cursorY, model, regularFont, boldFont);
  cursorY = drawIntroBlock(page, cursorY, model, regularFont, boldFont);

  for (const [sectionIndex, section] of model.sections.entries()) {
    const firstRowHeight =
      section.rows.length > 0 ? measureProcedureRow(section.rows[0], regularFont, boldFont).height : 0;

    if (cursorY - (66 + firstRowHeight) < PAGE_MARGIN) {
      page = addStyledPage(pdf);
      cursorY = PAGE_HEIGHT - PAGE_MARGIN;
    }

    cursorY = drawSectionHeading(page, cursorY, sectionIndex + 1, section.title, boldFont);

    for (const row of section.rows) {
      const layout = measureProcedureRow(row, regularFont, boldFont);
      if (cursorY - layout.height < PAGE_MARGIN) {
        page = addStyledPage(pdf);
        cursorY = PAGE_HEIGHT - PAGE_MARGIN;
        cursorY = drawSectionHeading(
          page,
          cursorY,
          sectionIndex + 1,
          `${section.title} 続き`,
          boldFont
        );
      }

      cursorY = drawProcedureRow(page, cursorY, row, layout, regularFont, boldFont);
    }
  }

  if (model.escalationFlags.length > 0) {
    const advisoryHeight = 60;
    if (cursorY - advisoryHeight < PAGE_MARGIN) {
      page = addStyledPage(pdf);
      cursorY = PAGE_HEIGHT - PAGE_MARGIN;
    }
    drawAdvisoryNote(page, cursorY, regularFont, boldFont);
  }

  return pdf.save();
}

function addStyledPage(pdf: PDFDocument) {
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: COLOR_PAGE_BG
  });
  return page;
}

function drawDocumentHeader(
  page: PDFPage,
  topY: number,
  model: ChecklistPdfModel,
  regularFont: PDFFont,
  boldFont: PDFFont
) {
  const labelWidth = 112;
  const labelHeight = 18;
  const metaWidth = 132;
  const titleWidth = CONTENT_WIDTH - metaWidth - 18;
  const metaX = PAGE_MARGIN + CONTENT_WIDTH - metaWidth;
  const titleX = PAGE_MARGIN;

  page.drawRectangle({
    x: PAGE_MARGIN,
    y: topY - labelHeight,
    width: labelWidth,
    height: labelHeight,
    color: COLOR_ACCENT
  });

  page.drawText(model.documentLabel, {
    x: PAGE_MARGIN + 10,
    y: topY - 12,
    size: 8,
    font: boldFont,
    color: COLOR_WHITE
  });

  page.drawText(model.title, {
    x: titleX,
    y: topY - 52,
    size: 22,
    font: boldFont,
    color: COLOR_TEXT
  });
  let leftCursorY = topY - 60;

  page.drawRectangle({
    x: titleX,
    y: leftCursorY - 4,
    width: 70,
    height: 2,
    color: COLOR_ACCENT
  });

  let rightCursorY = topY - 4;
  rightCursorY = drawMetaBlock(
    page,
    metaX,
    rightCursorY,
    "Generation Date",
    extractMetaValue(model.generatedAtLabel),
    regularFont,
    boldFont
  );
  rightCursorY -= 10;
  rightCursorY = drawMetaBlock(
    page,
    metaX,
    rightCursorY,
    "Target",
    "診断回答ベース",
    regularFont,
    boldFont
  );

  const nextY = Math.min(leftCursorY - 18, rightCursorY - 8);
  return nextY;
}

function drawMetaBlock(
  page: PDFPage,
  x: number,
  topY: number,
  label: string,
  value: string,
  regularFont: PDFFont,
  boldFont: PDFFont
) {
  let cursorY = drawLines(page, [label], {
    x,
    cursorY: topY,
    font: boldFont,
    fontSize: HEADER_META_LABEL_SIZE,
    lineHeight: 10,
    color: COLOR_SUBTLE
  });

  cursorY = drawLines(page, wrapText(value, regularFont, HEADER_META_VALUE_SIZE, 132), {
    x,
    cursorY: cursorY - 1,
    font: regularFont,
    fontSize: HEADER_META_VALUE_SIZE,
    lineHeight: 13,
    color: COLOR_TEXT
  });

  return cursorY;
}

function drawIntroBlock(
  page: PDFPage,
  topY: number,
  model: ChecklistPdfModel,
  regularFont: PDFFont,
  boldFont: PDFFont
) {
  const leftWidth = 168;
  const gap = 16;
  const rightWidth = CONTENT_WIDTH - leftWidth - gap;
  const leftX = PAGE_MARGIN;
  const rightX = leftX + leftWidth + gap;
  const boxTop = topY;
  const boxBottom = boxTop - INTRO_HEIGHT;

  page.drawRectangle({
    x: leftX,
    y: boxBottom,
    width: leftWidth,
    height: INTRO_HEIGHT,
    color: COLOR_ACCENT_SOFT
  });

  page.drawRectangle({
    x: rightX,
    y: boxBottom,
    width: rightWidth,
    height: INTRO_HEIGHT,
    borderColor: COLOR_RULE,
    borderWidth: 1
  });

  let leftCursorY = boxTop - 16;
  leftCursorY = drawLines(page, ["一般案内"], {
    x: leftX + 14,
    cursorY: leftCursorY,
    font: boldFont,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    color: COLOR_ACCENT
  });
  leftCursorY = drawLines(page, wrapText(model.trustNotice, regularFont, BODY_FONT_SIZE, leftWidth - 28), {
    x: leftX + 14,
    cursorY: leftCursorY - 2,
    font: regularFont,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    color: COLOR_TEXT
  });
  leftCursorY = drawLines(page, ["公式情報"], {
    x: leftX + 14,
    cursorY: leftCursorY - 2,
    font: boldFont,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    color: COLOR_ACCENT
  });
  leftCursorY = drawLines(
    page,
    wrapText("各手続きの詳細は、記載した公式確認先で最新情報を確認してください。", regularFont, BODY_FONT_SIZE, leftWidth - 28),
    {
      x: leftX + 14,
      cursorY: leftCursorY - 2,
      font: regularFont,
      fontSize: BODY_FONT_SIZE,
      lineHeight: BODY_LINE_HEIGHT,
      color: COLOR_TEXT
    }
  );

  if (model.escalationFlags.length > 0) {
    drawLines(page, ["要相談あり"], {
      x: leftX + 14,
      cursorY: boxBottom + 18,
      font: boldFont,
      fontSize: LABEL_FONT_SIZE,
      lineHeight: LABEL_LINE_HEIGHT,
      color: COLOR_SUBTLE
    });
  }

  let rightCursorY = boxTop - 16;
  rightCursorY = drawLines(page, ["Memo / Notes"], {
    x: rightX + 14,
    cursorY: rightCursorY,
    font: boldFont,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    color: COLOR_ACCENT
  });

  for (let index = 0; index < MEMO_LINE_COUNT; index += 1) {
    const y = rightCursorY - 12 - index * 22;
    page.drawLine({
      start: { x: rightX + 14, y },
      end: { x: rightX + rightWidth - 14, y },
      color: COLOR_RULE,
      thickness: 0.8
    });
  }

  return boxBottom - 24;
}

function drawSectionHeading(
  page: PDFPage,
  topY: number,
  sectionNumber: number,
  title: string,
  boldFont: PDFFont
) {
  page.drawText(String(sectionNumber).padStart(2, "0"), {
    x: PAGE_MARGIN,
    y: topY - SECTION_NUMBER_SIZE,
    size: SECTION_NUMBER_SIZE,
    font: boldFont,
    color: rgb(0.76, 0.69, 0.62)
  });

  page.drawText(title, {
    x: PAGE_MARGIN + 68,
    y: topY - SECTION_TITLE_SIZE,
    size: SECTION_TITLE_SIZE,
    font: boldFont,
    color: COLOR_TEXT
  });

  page.drawLine({
    start: { x: PAGE_MARGIN + 68, y: topY - 20 },
    end: { x: PAGE_MARGIN + CONTENT_WIDTH, y: topY - 20 },
    color: COLOR_TEXT,
    thickness: 1
  });

  return topY - 42;
}

function drawProcedureRow(
  page: PDFPage,
  topY: number,
  row: ChecklistPdfRow,
  layout: ProcedureRowLayout,
  regularFont: PDFFont,
  boldFont: PDFFont
) {
  const textX = PAGE_MARGIN + CHECKBOX_SIZE + 14;
  let cursorY = topY;

  page.drawLine({
    start: { x: PAGE_MARGIN, y: cursorY },
    end: { x: PAGE_MARGIN + CONTENT_WIDTH, y: cursorY },
    color: COLOR_RULE,
    thickness: 0.8
  });

  cursorY -= 12;

  page.drawRectangle({
    x: PAGE_MARGIN,
    y: cursorY - CHECKBOX_SIZE + 2,
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderColor: COLOR_MUTED,
    borderWidth: 1.2
  });

  cursorY = drawLines(page, layout.procedureNameLines, {
    x: textX,
    cursorY,
    font: boldFont,
    fontSize: TITLE_FONT_SIZE,
    lineHeight: TITLE_LINE_HEIGHT,
    color: COLOR_TEXT
  });

  const badgeWidth = Math.max(
    48,
    regularFont.widthOfTextAtSize(row.confirmationSourceType, LABEL_FONT_SIZE) + 16
  );
  page.drawRectangle({
    x: textX,
    y: cursorY - 13,
    width: badgeWidth,
    height: 14,
    borderColor: COLOR_RULE,
    borderWidth: 0.8
  });
  page.drawText(row.confirmationSourceType, {
    x: textX + 8,
    y: cursorY - 9,
    size: LABEL_FONT_SIZE,
    font: boldFont,
    color: COLOR_SUBTLE
  });
  cursorY -= 22;

  for (const detail of layout.detailLines) {
    cursorY = drawLines(page, detail.lines, {
      x: textX,
      cursorY,
      font: regularFont,
      fontSize: BODY_FONT_SIZE,
      lineHeight: BODY_LINE_HEIGHT,
      color: detail.color
    });
    cursorY -= 4;
  }

  return cursorY - ROW_GAP;
}

function measureProcedureRow(
  row: ChecklistPdfRow,
  regularFont: PDFFont,
  boldFont: PDFFont
): ProcedureRowLayout {
  const textWidth = CONTENT_WIDTH - CHECKBOX_SIZE - 14;
  const procedureNameLines = wrapText(row.procedureName, boldFont, TITLE_FONT_SIZE, textWidth);
  const detailDefinitions = [
    { text: row.reasonShown, color: COLOR_TEXT },
    { text: `準備物: ${row.preparationHints}`, color: COLOR_MUTED },
    { text: `確認先: ${row.confirmationSourceType}`, color: COLOR_MUTED },
    { text: `公式: ${row.officialLink}`, color: COLOR_MUTED },
    { text: `注意: ${row.disclaimerText}`, color: row.requiresExpertEscalation ? COLOR_ACCENT : COLOR_MUTED },
    { text: row.updateDateLabel, color: COLOR_SUBTLE }
  ];

  const detailLines = detailDefinitions.map((detail) => ({
    lines: wrapText(detail.text, regularFont, BODY_FONT_SIZE, textWidth),
    color: detail.color
  }));

  const detailsHeight = detailLines.reduce((total, detail) => {
    return total + detail.lines.length * BODY_LINE_HEIGHT + 4;
  }, 0);

  const height = 12 + procedureNameLines.length * TITLE_LINE_HEIGHT + 22 + detailsHeight + ROW_GAP + 6;

  return {
    procedureNameLines,
    detailLines,
    height
  };
}

function drawAdvisoryNote(
  page: PDFPage,
  topY: number,
  regularFont: PDFFont,
  boldFont: PDFFont
) {
  const height = 54;
  const y = topY - height;
  page.drawRectangle({
    x: PAGE_MARGIN,
    y,
    width: CONTENT_WIDTH,
    height,
    color: COLOR_ACCENT_SOFT
  });
  drawLines(page, ["要相談"], {
    x: PAGE_MARGIN + 14,
    cursorY: topY - 14,
    font: boldFont,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    color: COLOR_ACCENT
  });
  drawLines(
    page,
    wrapText(
      "相続人調整や借金の可能性がある場合は、弁護士・税理士・司法書士などの専門家相談も検討してください。",
      regularFont,
      BODY_FONT_SIZE,
      CONTENT_WIDTH - 28
    ),
    {
      x: PAGE_MARGIN + 14,
      cursorY: topY - 28,
      font: regularFont,
      fontSize: BODY_FONT_SIZE,
      lineHeight: BODY_LINE_HEIGHT,
      color: COLOR_TEXT
    }
  );
}

function drawLines(page: PDFPage, lines: string[], options: DrawLinesOptions) {
  let cursorY = options.cursorY;

  for (const line of lines) {
    page.drawText(line, {
      x: options.x,
      y: cursorY - options.fontSize,
      size: options.fontSize,
      font: options.font,
      color: options.color
    });
    cursorY -= options.lineHeight;
  }

  return cursorY;
}

function wrapText(
  value: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  if (value.length === 0) {
    return [""];
  }

  const tokens = tokenize(value);
  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const candidate = current.length === 0 ? token : `${current}${token}`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      lines.push(current);
    }

    if (font.widthOfTextAtSize(token, fontSize) <= maxWidth) {
      current = token;
      continue;
    }

    let chunk = "";
    for (const character of token) {
      const chunkCandidate = `${chunk}${character}`;
      if (font.widthOfTextAtSize(chunkCandidate, fontSize) > maxWidth && chunk.length > 0) {
        lines.push(chunk);
        chunk = character;
      } else {
        chunk = chunkCandidate;
      }
    }
    current = chunk;
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}

function tokenize(value: string): string[] {
  const tokens = value.match(/\S+\s*|\s+/gu);
  return tokens && tokens.length > 0 ? tokens : Array.from(value);
}

function extractMetaValue(label: string): string {
  const [, value] = label.split(":");
  return value?.trim() || label;
}

interface ProcedureRowLayout {
  procedureNameLines: string[];
  detailLines: Array<{
    lines: string[];
    color: ReturnType<typeof rgb>;
  }>;
  height: number;
}

interface DrawLinesOptions {
  x: number;
  cursorY: number;
  font: PDFFont;
  fontSize: number;
  lineHeight: number;
  color: ReturnType<typeof rgb>;
}
