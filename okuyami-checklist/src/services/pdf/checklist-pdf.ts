import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import {
  buildChecklistPdfModel,
  type ChecklistPdfModel,
  type ChecklistPdfRow,
  type ChecklistPdfSection
} from "./checklist-pdf-model";
import { getNotoSansCjkJpSubsetBytes } from "./assets/noto-sans-cjk-jp-subset";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const CARD_PADDING = 12;
const CARD_GAP = 14;
const LABEL_FONT_SIZE = 9;
const VALUE_FONT_SIZE = 10;
const TITLE_FONT_SIZE = 11;
const LABEL_LINE_HEIGHT = 12;
const VALUE_LINE_HEIGHT = 14;
const FIELD_GAP = 8;
const VALUE_INDENT = 18;
const MEMO_LINE_GAP = 14;

export { buildChecklistPdfModel };
export type { ChecklistPdfModel };

export async function buildChecklistPdf(model: ChecklistPdfModel): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = getNotoSansCjkJpSubsetBytes();
  const regularFont = await pdf.embedFont(fontBytes);
  const boldFont = regularFont;
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - PAGE_MARGIN;

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY - requiredHeight < PAGE_MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      cursorY = PAGE_HEIGHT - PAGE_MARGIN;
    }
  };

  const drawParagraph = (
    value: string,
    fontSize: number,
    font: PDFFont,
    color = rgb(0.15, 0.15, 0.18)
  ) => {
    const lines = wrapText(value, font, fontSize, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(fontSize + 4);
      page.drawText(line, {
        x: PAGE_MARGIN,
        y: cursorY - fontSize,
        size: fontSize,
        font,
        color
      });
      cursorY -= fontSize + 4;
    }
  };

  drawParagraph(model.title, 18, boldFont);
  drawParagraph(model.generatedAtLabel, 11, regularFont, rgb(0.35, 0.35, 0.4));
  drawParagraph(`Escalation flags: ${model.escalationFlags.join(", ") || "none"}`, 10, regularFont);
  cursorY -= 10;

  for (const section of model.sections) {
    drawSectionHeading(section, boldFont, ensureSpace, (value, size, font, color) =>
      drawParagraph(value, size, font, color)
    );

    for (const row of section.rows) {
      const layout = measureRowLayout(row, regularFont, boldFont);
      ensureSpace(layout.height);
      drawRowCard(page, row, layout, regularFont, boldFont, cursorY);
      cursorY -= layout.height + CARD_GAP;
    }
  }

  return pdf.save();
}

function drawSectionHeading(
  section: ChecklistPdfSection,
  boldFont: PDFFont,
  ensureSpace: (requiredHeight: number) => void,
  drawParagraph: (
    value: string,
    fontSize: number,
    font: PDFFont,
    color?: ReturnType<typeof rgb>
  ) => void
) {
  ensureSpace(36);
  drawParagraph(section.title, 14, boldFont);
}

function drawRowCard(
  page: PDFPage,
  row: ChecklistPdfRow,
  layout: RowLayout,
  regularFont: PDFFont,
  boldFont: PDFFont,
  topY: number
) {
  const cardHeight = layout.height;
  const cardY = topY - cardHeight;
  const contentX = PAGE_MARGIN + CARD_PADDING;
  const innerWidth = CONTENT_WIDTH - CARD_PADDING * 2;
  page.drawRectangle({
    x: PAGE_MARGIN,
    y: cardY,
    width: CONTENT_WIDTH,
    height: cardHeight,
    borderColor: rgb(0.85, 0.85, 0.88),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.99)
  });

  let cursorY = topY - CARD_PADDING;

  const drawTextLines = (
    lines: string[],
    x: number,
    font: PDFFont,
    fontSize: number,
    lineHeight: number,
    color = rgb(0.15, 0.15, 0.18)
  ) => {
    for (const line of lines) {
      page.drawText(line, {
        x,
        y: cursorY - fontSize,
        size: fontSize,
        font,
        color
      });
      cursorY -= lineHeight;
    }
  };

  for (const field of layout.fields) {
    drawTextLines(field.labelLines, contentX, boldFont, field.labelFontSize, LABEL_LINE_HEIGHT);
    drawTextLines(
      field.valueLines,
      contentX + VALUE_INDENT,
      field.valueFont === "bold" ? boldFont : regularFont,
      field.valueFontSize,
      VALUE_LINE_HEIGHT
    );
    cursorY -= FIELD_GAP;
  }

  drawTextLines(["Memo"], contentX, boldFont, LABEL_FONT_SIZE, LABEL_LINE_HEIGHT);

  for (let index = 0; index < row.memoLines; index += 1) {
    const y = cursorY - index * MEMO_LINE_GAP;
    page.drawLine({
      start: { x: contentX, y },
      end: { x: contentX + innerWidth, y },
      color: rgb(0.82, 0.82, 0.86),
      thickness: 0.8
    });
  }
}

function measureRowLayout(
  row: ChecklistPdfRow,
  regularFont: PDFFont,
  boldFont: PDFFont
): RowLayout {
  const innerWidth = CONTENT_WIDTH - CARD_PADDING * 2;
  const fields: RowFieldLayout[] = [
    buildFieldLayout("Procedure", row.procedureName, innerWidth, boldFont, boldFont, "bold"),
    buildFieldLayout("Reason", row.reasonShown, innerWidth, boldFont, regularFont),
    buildFieldLayout("Deadline", row.deadlineBucketLabel, innerWidth, boldFont, regularFont),
    buildFieldLayout("Preparation", row.preparationHints, innerWidth, boldFont, regularFont),
    buildFieldLayout(
      "Confirmation source",
      row.confirmationSourceType,
      innerWidth,
      boldFont,
      regularFont
    ),
    buildFieldLayout("Official link", row.officialLink, innerWidth, boldFont, regularFont),
    buildFieldLayout("Updated", row.updateDateLabel, innerWidth, boldFont, regularFont),
    buildFieldLayout("Disclaimer", row.disclaimerText, innerWidth, boldFont, regularFont),
    buildFieldLayout(
      "Expert escalation",
      row.requiresExpertEscalation ? "required" : "not required",
      innerWidth,
      boldFont,
      regularFont
    )
  ];

  const fieldsHeight = fields.reduce((total, field) => {
    return (
      total +
      field.labelLines.length * LABEL_LINE_HEIGHT +
      field.valueLines.length * VALUE_LINE_HEIGHT +
      FIELD_GAP
    );
  }, 0);
  const memoHeight = LABEL_LINE_HEIGHT + row.memoLines * MEMO_LINE_GAP;

  return {
    fields,
    height: CARD_PADDING * 2 + fieldsHeight + memoHeight
  };
}

function buildFieldLayout(
  label: string,
  value: string,
  innerWidth: number,
  labelFont: PDFFont,
  valueFont: PDFFont,
  emphasis: "regular" | "bold" = "regular"
): RowFieldLayout {
  const valueFontSize = emphasis === "bold" ? TITLE_FONT_SIZE : VALUE_FONT_SIZE;
  const labelLines = wrapText(label, labelFont, LABEL_FONT_SIZE, innerWidth);
  const valueLines = wrapText(value, valueFont, valueFontSize, innerWidth - VALUE_INDENT);

  return {
    labelLines,
    valueLines,
    labelFontSize: LABEL_FONT_SIZE,
    valueFontSize,
    valueFont: emphasis
  };
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

  const words = value.split(/\s+/u);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      lines.push(current);
    }

    if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
      current = word;
      continue;
    }

    let chunk = "";
    for (const character of word) {
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

interface RowFieldLayout {
  labelLines: string[];
  valueLines: string[];
  labelFontSize: number;
  valueFontSize: number;
  valueFont: "regular" | "bold";
}

interface RowLayout {
  fields: RowFieldLayout[];
  height: number;
}
