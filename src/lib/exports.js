/* ============================================================================
   EXPORT UTILITIES — generate PDF / Excel / Word files client-side.
   All three run in the browser (no server roundtrip) and trigger a
   download.

   Inspection summary export takes the structured payload Claude returned
   and the source inspection metadata, produces a polished report. Same
   data shape across all three formats so the user can pick whichever
   their workflow needs.

   Library notes:
   - PDF: jsPDF (pre-existing dep). Tables drawn manually since
     jspdf-autotable would add another dep for marginal value.
   - Excel: exceljs — fluent API, supports styling.
   - Word: docx — declarative document tree.
   ============================================================================ */
import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle
} from "docx";

/* ── Shared helpers ──────────────────────────────────────────────────── */

const fmtCostRange = (cost) => {
  if (!cost || (cost.min == null && cost.max == null)) return "—";
  if (cost.min != null && cost.max != null) return `$${cost.min.toLocaleString()} – $${cost.max.toLocaleString()}`;
  if (cost.min != null) return `$${cost.min.toLocaleString()}+`;
  return `up to $${cost.max.toLocaleString()}`;
};

const SECTION_LABELS = {
  urgent:        "Urgent (safety)",
  immediate:     "Immediate (0-6 mo)",
  recommended:   "Recommended (6-24 mo)",
  deferred:      "Deferred / cosmetic",
  goodCondition: "In good condition"
};

const SECTION_ORDER = ["urgent", "immediate", "recommended", "deferred", "goodCondition"];

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

const inspectionFilename = (inspection, ext) => {
  const addr = (inspection.property_address || "inspection").replace(/[^a-zA-Z0-9 -]/g, "").slice(0, 60);
  const date = (inspection.created_at || new Date().toISOString()).slice(0, 10);
  return `Inspection — ${addr} — ${date}.${ext}`;
};

/* ── PDF ─────────────────────────────────────────────────────────────── */

export function exportInspectionPDF(inspection) {
  const summary = inspection.summary || {};
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (h) => {
    if (y + h > pageHeight - margin) { doc.addPage(); y = margin; }
  };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Inspection Summary", margin, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100);
  if (inspection.property_address) {
    doc.text(inspection.property_address, margin, y);
    y += 16;
  }
  doc.text(`Generated ${(inspection.created_at || new Date().toISOString()).slice(0, 10)}`, margin, y);
  y += 22;

  // Overview
  if (summary.overview) {
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Overview", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(summary.overview, contentWidth);
    ensureSpace(lines.length * 13);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 10;
  }

  // Cost range
  if (summary.totalEstCostMin != null || summary.totalEstCostMax != null) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(180, 50, 50);
    const range = fmtCostRange({ min: summary.totalEstCostMin, max: summary.totalEstCostMax });
    doc.text(`Estimated cost (urgent + immediate):  ${range}`, margin, y);
    doc.setTextColor(0);
    y += 22;
  }

  // Sections
  for (const key of SECTION_ORDER) {
    const items = summary[key];
    if (!Array.isArray(items) || items.length === 0) continue;
    ensureSpace(40);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(SECTION_LABELS[key], margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    for (const item of items) {
      const line = key === "goodCondition"
        ? `• ${item}`
        : `• ${item.issue || item}${item.location ? ` — ${item.location}` : ""}${item.estCost ? `  (${fmtCostRange(item.estCost)})` : ""}`;
      const wrapped = doc.splitTextToSize(line, contentWidth);
      ensureSpace(wrapped.length * 12 + 4);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 12 + 4;
    }
    y += 8;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`DealTrack Inspection Summary — page ${i} of ${totalPages}`, margin, pageHeight - 24);
  }

  doc.save(inspectionFilename(inspection, "pdf"));
}

/* ── Excel ───────────────────────────────────────────────────────────── */

export async function exportInspectionExcel(inspection) {
  const summary = inspection.summary || {};
  const wb = new ExcelJS.Workbook();
  wb.creator = "DealTrack";
  wb.created = new Date();

  // Sheet 1: Summary
  const overview = wb.addWorksheet("Summary");
  overview.columns = [{ width: 32 }, { width: 80 }];
  overview.addRow(["Inspection Summary"]).font = { size: 16, bold: true };
  overview.addRow([]);
  overview.addRow(["Property", inspection.property_address || "—"]);
  overview.addRow(["Generated", (inspection.created_at || new Date().toISOString()).slice(0, 10)]);
  overview.addRow(["Source file", inspection.filename || "—"]);
  overview.addRow([]);
  overview.addRow(["Overview"]).font = { bold: true };
  const overviewRow = overview.addRow([summary.overview || ""]);
  overviewRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
  overview.mergeCells(`A${overviewRow.number}:B${overviewRow.number}`);
  overview.getRow(overviewRow.number).height = 60;
  overview.addRow([]);
  if (summary.totalEstCostMin != null || summary.totalEstCostMax != null) {
    const r = overview.addRow([
      "Estimated cost (urgent + immediate)",
      fmtCostRange({ min: summary.totalEstCostMin, max: summary.totalEstCostMax })
    ]);
    r.font = { bold: true, color: { argb: "FFB91C1C" } };
  }

  // Sheet 2: Findings (flat table — easy to filter/sort)
  const findings = wb.addWorksheet("Findings");
  findings.columns = [
    { header: "Category",  key: "category",  width: 22 },
    { header: "Issue",     key: "issue",     width: 50 },
    { header: "Location",  key: "location",  width: 32 },
    { header: "Cost (min)", key: "min",      width: 12 },
    { header: "Cost (max)", key: "max",      width: 12 }
  ];
  findings.getRow(1).font = { bold: true };
  findings.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

  const colorMap = {
    urgent:      "FFFEE2E2",
    immediate:   "FFFFEDD5",
    recommended: "FFFEF9C3",
    deferred:    "FFE0F2FE",
    goodCondition: "FFDCFCE7"
  };

  for (const key of SECTION_ORDER) {
    const items = summary[key];
    if (!Array.isArray(items) || items.length === 0) continue;
    const label = SECTION_LABELS[key];
    for (const item of items) {
      const r = findings.addRow({
        category: label,
        issue: typeof item === "string" ? item : (item.issue || ""),
        location: typeof item === "string" ? "" : (item.location || ""),
        min: item?.estCost?.min ?? null,
        max: item?.estCost?.max ?? null
      });
      r.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colorMap[key] } };
        cell.alignment = { wrapText: true, vertical: "top" };
      });
    }
  }
  findings.autoFilter = { from: "A1", to: "E1" };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, inspectionFilename(inspection, "xlsx"));
}

/* ── Word ────────────────────────────────────────────────────────────── */

export async function exportInspectionWord(inspection) {
  const summary = inspection.summary || {};
  const children = [];

  children.push(new Paragraph({
    text: "Inspection Summary",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT
  }));
  if (inspection.property_address) {
    children.push(new Paragraph({ children: [new TextRun({ text: inspection.property_address, italics: true, color: "555555" })] }));
  }
  children.push(new Paragraph({
    children: [new TextRun({ text: `Generated ${(inspection.created_at || new Date().toISOString()).slice(0, 10)}`, color: "888888", size: 18 })]
  }));
  children.push(new Paragraph({ text: "" }));

  if (summary.overview) {
    children.push(new Paragraph({ text: "Overview", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: summary.overview }));
    children.push(new Paragraph({ text: "" }));
  }

  if (summary.totalEstCostMin != null || summary.totalEstCostMax != null) {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: "Estimated cost (urgent + immediate): ", bold: true }),
        new TextRun({ text: fmtCostRange({ min: summary.totalEstCostMin, max: summary.totalEstCostMax }), bold: true, color: "B91C1C" })
      ]
    }));
    children.push(new Paragraph({ text: "" }));
  }

  for (const key of SECTION_ORDER) {
    const items = summary[key];
    if (!Array.isArray(items) || items.length === 0) continue;
    children.push(new Paragraph({ text: SECTION_LABELS[key], heading: HeadingLevel.HEADING_2 }));

    if (key === "goodCondition") {
      for (const item of items) {
        children.push(new Paragraph({ text: typeof item === "string" ? item : (item.issue || ""), bullet: { level: 0 } }));
      }
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    // Table per finding category
    const rows = [
      new TableRow({
        children: ["Issue", "Location", "Cost"].map(h => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
          shading: { fill: "E5E7EB" }
        }))
      })
    ];
    for (const item of items) {
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(item.issue || "")] }),
          new TableCell({ children: [new Paragraph(item.location || "")] }),
          new TableCell({ children: [new Paragraph(fmtCostRange(item.estCost))] })
        ]
      }));
    }
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" },
        left:   { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" },
        right:  { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
        insideVertical:   { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" }
      }
    }));
    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, inspectionFilename(inspection, "docx"));
}
