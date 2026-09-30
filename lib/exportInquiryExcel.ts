import ExcelJS from "exceljs";
import { formatLabel, getOrchidBySlug } from "../data/orchids";
import { totalsByUnit, type InquiryItem } from "./inquiry";

const HEADERS = [
  "Product",
  "Product Code",
  "Product Type",
  "Size",
  "Stem Length (cm)",
  "Quantity",
  "Unit",
] as const;

const HEADER_FILL = "48235C";
const COLUMN_WIDTHS = [22, 14, 22, 10, 16, 12, 12];

export type InquiryExcelContactSummary = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  message: string;
  submittedAt: Date;
};

export type InquiryExcelRow = {
  product: string;
  productCode: string;
  productType: string;
  size: string;
  stemLength: string;
  quantity: number;
  unit: string;
};

/** Strip trailing unit label from length ranges like "45–50 cm". */
function stemLengthForExcel(lengthRange: string | undefined): string {
  if (!lengthRange?.trim()) return "";
  return lengthRange.replace(/\s*cm\s*$/i, "").trim();
}

export function inquiryItemsToExcelRows(items: InquiryItem[]): InquiryExcelRow[] {
  return items
    .filter((item) => item.quantity > 0)
    .map((item) => {
      const product = getOrchidBySlug(item.slug);
      const isLoose = item.format === "loose";

      return {
        product: item.name,
        productCode: product?.number?.trim() ?? "",
        productType: formatLabel(item.format),
        // Fresh Loose Blooms: never invent size / stem length.
        size: isLoose ? "" : (item.sizeLabel?.trim() ?? ""),
        stemLength: isLoose ? "" : stemLengthForExcel(item.lengthRange),
        quantity: item.quantity,
        unit: item.unit,
      };
    });
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function buildInquiryExcelFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  return `Origin-Blooms-Inquiry-${y}-${m}-${d}-${hh}${mm}.xlsx`;
}

function formatSubmittedAt(date: Date): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
}

/**
 * Builds a real .xlsx buffer from confirmed inquiry lines (server-side only).
 * Includes a contact summary block above the product table.
 */
export async function buildInquiryExcelAttachment(
  items: InquiryItem[],
  contact: InquiryExcelContactSummary,
): Promise<{ filename: string; buffer: Buffer; contentType: string }> {
  const rows = inquiryItemsToExcelRows(items);
  if (rows.length === 0) {
    throw new Error("No inquiry items with quantity greater than 0 to export.");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Origin Blooms";
  workbook.created = contact.submittedAt;

  const sheet = workbook.addWorksheet("Inquiry");

  const summaryPairs: [string, string][] = [
    ["Contact name", contact.name || "—"],
    ["Business name", contact.businessName || "—"],
    ["Email", contact.email || "—"],
    ["Phone", contact.phone || "—"],
    ["Message", contact.message || "—"],
    ["Submitted", formatSubmittedAt(contact.submittedAt)],
  ];

  const summaryTitle = sheet.addRow(["Inquiry summary"]);
  summaryTitle.getCell(1).font = { bold: true, name: "Calibri", size: 12, color: { argb: "FF48235C" } };

  for (const [label, value] of summaryPairs) {
    const summaryRow = sheet.addRow([label, value]);
    summaryRow.getCell(1).font = { bold: true, name: "Calibri", size: 11 };
    summaryRow.getCell(2).alignment = { wrapText: true, vertical: "top" };
    if (label === "Message") {
      summaryRow.height = Math.min(120, Math.max(30, Math.ceil(value.length / 60) * 15));
    }
  }

  sheet.addRow([]);

  const headerRowNumber = sheet.rowCount + 1;
  const headerRow = sheet.addRow([...HEADERS]);
  styleHeaderRow(headerRow);

  for (const row of rows) {
    const excelRow = sheet.addRow([
      row.product,
      row.productCode,
      row.productType,
      row.size,
      row.stemLength,
      row.quantity,
      row.unit,
    ]);
    excelRow.getCell(6).numFmt = "0";
  }

  const dataEndRow = sheet.rowCount;

  const totals = totalsByUnit(items.filter((item) => item.quantity > 0));
  if (totals.length > 0) {
    sheet.addRow([]);
    const totalsTitle = sheet.addRow(["Totals by unit"]);
    totalsTitle.getCell(1).font = { bold: true, name: "Calibri", size: 11 };

    for (const entry of totals) {
      const totalRow = sheet.addRow([
        entry.unit,
        "",
        "",
        "",
        "",
        entry.total,
        entry.unit,
      ]);
      totalRow.getCell(6).numFmt = "0";
      totalRow.getCell(1).font = { bold: true };
    }
  }

  COLUMN_WIDTHS.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  // Contact summary values often need more room in column B.
  sheet.getColumn(2).width = Math.max(COLUMN_WIDTHS[1], 36);

  sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
  sheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: dataEndRow, column: HEADERS.length },
  };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    filename: buildInquiryExcelFilename(contact.submittedAt),
    buffer,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}
