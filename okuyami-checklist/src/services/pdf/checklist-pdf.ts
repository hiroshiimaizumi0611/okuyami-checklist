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
const TITLE_FONT_SIZE = 20;
const TITLE_LINE_HEIGHT = 26;
const SECTION_FONT_SIZE = 14;
const SECTION_LINE_HEIGHT = 20;
const PROCEDURE_FONT_SIZE = 13;
const PROCEDURE_LINE_HEIGHT = 18;
const BODY_FONT_SIZE = 10;
const BODY_LINE_HEIGHT = 15;
const LABEL_FONT_SIZE = 9;
const LABEL_LINE_HEIGHT = 12;
const BLOCK_PADDING_TOP = 12;
const BLOCK_PADDING_BOTTOM = 14;
const FIELD_GAP = 10;
const SECTION_GAP = 20;
const MEMO_LINE_GAP = 14;
const MEMO_LABEL_HEIGHT = 16;

const COLOR_TEXT = rgb(0.1, 0.1, 0.11);
const COLOR_MUTED = rgb(0.42, 0.42, 0.45);
const COLOR_RULE = rgb(0.83, 0.84, 0.82);
const COLOR_STRONG_RULE = rgb(0.15, 0.16, 0.15);

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

  cursorY = drawTitleBlock(page, cursorY, model, regularFont, boldFont);

  for (const section of model.sections) {
    const firstRowHeight =
      section.rows.length > 0
        ? measureProcedureBlock(section.rows[0], regularFont, boldFont).height
        : 0;

    if (cursorY - (SECTION_LINE_HEIGHT + 20 + firstRowHeight) < PAGE_MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      cursorY = PAGE_HEIGHT - PAGE_MARGIN;
    }

    cursorY = drawSectionHeading(page, cursorY, section.title, boldFont);

    for (const row of section.rows) {
      const layout = measureProcedureBlock(row, regularFont, boldFont);
      if (cursorY - layout.height < PAGE_MARGIN) {
        page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        cursorY = PAGE_HEIGHT - PAGE_MARGIN;
        cursorY = drawSectionHeading(page, cursorY, `${section.title} 続き`, boldFont);
      }

      cursorY = drawProcedureBlock(page, cursorY, row, layout, regularFont, boldFont);
    }
  }

  return pdf.save();
}

function drawTitleBlock(
  page: PDFPage,
  topY: number,
  model: ChecklistPdfModel,
  regularFont: PDFFont,
  boldFont: PDFFont
) {
  let cursorY = topY;

  cursorY = drawLines(page, wrapText(model.documentLabel, boldFont, LABEL_FONT_SIZE, CONTENT_WIDTH), {
    x: PAGE_MARGIN,
    cursorY,
    font: boldFont,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    color: COLOR_MUTED
  });

  cursorY = drawLines(page, wrapText(model.title, boldFont, TITLE_FONT_SIZE, CONTENT_WIDTH), {
    x: PAGE_MARGIN,
    cursorY: cursorY - 4,
    font: boldFont,
    fontSize: TITLE_FONT_SIZE,
    lineHeight: TITLE_LINE_HEIGHT,
    color: COLOR_TEXT
  });

  cursorY = drawLines(page, wrapText(model.generatedAtLabel, regularFont, BODY_FONT_SIZE, CONTENT_WIDTH), {
    x: PAGE_MARGIN,
    cursorY: cursorY - 2,
    font: regularFont,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    color: COLOR_MUTED
  });

  page.drawLine({
    start: { x: PAGE_MARGIN, y: cursorY - 8 },
    end: { x: PAGE_MARGIN + CONTENT_WIDTH, y: cursorY - 8 },
    color: COLOR_STRONG_RULE,
    thickness: 1
  });

  cursorY -= 22;

  cursorY = drawLines(page, ["一般案内"], {
    x: PAGE_MARGIN,
    cursorY,
    font: boldFont,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    color: COLOR_MUTED
  });

  cursorY = drawLines(page, wrapText(model.trustNotice, regularFont, BODY_FONT_SIZE, CONTENT_WIDTH), {
    x: PAGE_MARGIN,
    cursorY: cursorY - 2,
    font: regularFont,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    color: COLOR_TEXT
  });

  cursorY = drawLines(page, ["公式情報"], {
    x: PAGE_MARGIN,
    cursorY: cursorY - 2,
    font: boldFont,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    color: COLOR_MUTED
  });

  cursorY = drawLines(
    page,
    wrapText(
      "各手続きの詳細は、記載した公式確認先で最新情報を確認してください。",
      regularFont,
      BODY_FONT_SIZE,
      CONTENT_WIDTH
    ),
    {
      x: PAGE_MARGIN,
      cursorY: cursorY - 2,
      font: regularFont,
      fontSize: BODY_FONT_SIZE,
      lineHeight: BODY_LINE_HEIGHT,
      color: COLOR_TEXT
    }
  );

  if (model.escalationFlags.length > 0) {
    cursorY = drawLines(page, ["要相談"], {
      x: PAGE_MARGIN,
      cursorY: cursorY - 2,
      font: boldFont,
      fontSize: LABEL_FONT_SIZE,
      lineHeight: LABEL_LINE_HEIGHT,
      color: COLOR_MUTED
    });

    cursorY = drawLines(
      page,
      wrapText(
        "判断が分かれるケースでは、弁護士・税理士・司法書士などへの相談も検討してください。",
        regularFont,
        BODY_FONT_SIZE,
        CONTENT_WIDTH
      ),
      {
        x: PAGE_MARGIN,
        cursorY: cursorY - 2,
        font: regularFont,
        fontSize: BODY_FONT_SIZE,
        lineHeight: BODY_LINE_HEIGHT,
        color: COLOR_TEXT
      }
    );
  }

  return cursorY - 18;
}

function drawSectionHeading(
  page: PDFPage,
  topY: number,
  title: string,
  boldFont: PDFFont
) {
  let cursorY = topY;

  cursorY = drawLines(page, wrapText(title, boldFont, SECTION_FONT_SIZE, CONTENT_WIDTH), {
    x: PAGE_MARGIN,
    cursorY,
    font: boldFont,
    fontSize: SECTION_FONT_SIZE,
    lineHeight: SECTION_LINE_HEIGHT,
    color: COLOR_TEXT
  });

  page.drawLine({
    start: { x: PAGE_MARGIN, y: cursorY - 4 },
    end: { x: PAGE_MARGIN + CONTENT_WIDTH, y: cursorY - 4 },
    color: COLOR_RULE,
    thickness: 0.8
  });

  return cursorY - 12;
}

function drawProcedureBlock(
  page: PDFPage,
  topY: number,
  row: ChecklistPdfRow,
  layout: ProcedureBlockLayout,
  regularFont: PDFFont,
  boldFont: PDFFont
) {
  let cursorY = topY;

  page.drawLine({
    start: { x: PAGE_MARGIN, y: cursorY },
    end: { x: PAGE_MARGIN + CONTENT_WIDTH, y: cursorY },
    color: COLOR_RULE,
    thickness: 0.8
  });

  cursorY -= BLOCK_PADDING_TOP;

  cursorY = drawLines(page, [row.deadlineBucketLabel], {
    x: PAGE_MARGIN,
    cursorY,
    font: boldFont,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    color: COLOR_MUTED
  });

  cursorY = drawLines(page, layout.procedureNameLines, {
    x: PAGE_MARGIN,
    cursorY: cursorY - 2,
    font: boldFont,
    fontSize: PROCEDURE_FONT_SIZE,
    lineHeight: PROCEDURE_LINE_HEIGHT,
    color: COLOR_TEXT
  });

  for (const field of layout.fields) {
    cursorY = drawLines(page, field.labelLines, {
      x: PAGE_MARGIN,
      cursorY: cursorY - 2,
      font: boldFont,
      fontSize: LABEL_FONT_SIZE,
      lineHeight: LABEL_LINE_HEIGHT,
      color: COLOR_MUTED
    });

    cursorY = drawLines(page, field.valueLines, {
      x: PAGE_MARGIN,
      cursorY: cursorY - 2,
      font: regularFont,
      fontSize: BODY_FONT_SIZE,
      lineHeight: BODY_LINE_HEIGHT,
      color: COLOR_TEXT
    });

    cursorY -= FIELD_GAP;
  }

  cursorY = drawLines(page, ["メモ"], {
    x: PAGE_MARGIN,
    cursorY,
    font: boldFont,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    color: COLOR_MUTED
  });

  for (let index = 0; index < row.memoLines; index += 1) {
    const y = cursorY - 8 - index * MEMO_LINE_GAP;
    page.drawLine({
      start: { x: PAGE_MARGIN, y },
      end: { x: PAGE_MARGIN + CONTENT_WIDTH, y },
      color: COLOR_RULE,
      thickness: 0.8
    });
  }

  return cursorY - MEMO_LABEL_HEIGHT - row.memoLines * MEMO_LINE_GAP - BLOCK_PADDING_BOTTOM;
}

function measureProcedureBlock(
  row: ChecklistPdfRow,
  regularFont: PDFFont,
  boldFont: PDFFont
): ProcedureBlockLayout {
  const procedureNameLines = wrapText(
    row.procedureName,
    boldFont,
    PROCEDURE_FONT_SIZE,
    CONTENT_WIDTH
  );

  const fields = [
    buildFieldLayout("表示理由", row.reasonShown, regularFont, boldFont),
    buildFieldLayout("準備物", row.preparationHints, regularFont, boldFont),
    buildFieldLayout(
      "公式情報",
      `${row.confirmationSourceType}\n${row.officialLink}`,
      regularFont,
      boldFont
    ),
    buildFieldLayout("注意", row.disclaimerText, regularFont, boldFont),
    buildFieldLayout(
      "更新日",
      row.updateDateLabel,
      regularFont,
      boldFont
    ),
    buildFieldLayout(
      "要相談",
      row.requiresExpertEscalation ? "専門家と確認しながら進めることをおすすめします。" : "この項目は一般案内の範囲で確認できます。",
      regularFont,
      boldFont
    )
  ];

  const fieldHeight = fields.reduce((total, field) => {
    return (
      total +
      field.labelLines.length * LABEL_LINE_HEIGHT +
      field.valueLines.length * BODY_LINE_HEIGHT +
      FIELD_GAP
    );
  }, 0);

  const height =
    BLOCK_PADDING_TOP +
    LABEL_LINE_HEIGHT +
    2 +
    procedureNameLines.length * PROCEDURE_LINE_HEIGHT +
    fieldHeight +
    MEMO_LABEL_HEIGHT +
    row.memoLines * MEMO_LINE_GAP +
    BLOCK_PADDING_BOTTOM;

  return {
    procedureNameLines,
    fields,
    height
  };
}

function buildFieldLayout(
  label: string,
  value: string,
  regularFont: PDFFont,
  boldFont: PDFFont
): ProcedureFieldLayout {
  return {
    labelLines: wrapText(label, boldFont, LABEL_FONT_SIZE, CONTENT_WIDTH),
    valueLines: value
      .split("\n")
      .flatMap((chunk) => wrapText(chunk, regularFont, BODY_FONT_SIZE, CONTENT_WIDTH))
  };
}

function drawLines(
  page: PDFPage,
  lines: string[],
  options: DrawLinesOptions
) {
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

interface ProcedureFieldLayout {
  labelLines: string[];
  valueLines: string[];
}

interface ProcedureBlockLayout {
  procedureNameLines: string[];
  fields: ProcedureFieldLayout[];
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
