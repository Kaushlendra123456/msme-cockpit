import PDFDocument from "pdfkit";
import { Response } from "express";

interface SaleItemForInvoice {
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRatePercent: number;
  subtotal: number;
}

interface InvoiceData {
  invoiceNumber: string;
  saleDate: Date;
  business: {
    name: string;
    gstNumber?: string | null;
    location?: string | null;
  };
  customer?: {
    name: string;
    phone?: string | null;
    address?: string | null;
  } | null;
  items: SaleItemForInvoice[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: string;
}

export function generateInvoicePDF(data: InvoiceData, res: Response) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${data.invoiceNumber}.pdf`
  );

  doc.pipe(res);

  // --- Header ---
  doc.fontSize(20).text(data.business.name, { align: "left" });
  if (data.business.gstNumber) {
    doc.fontSize(10).text(`GSTIN: ${data.business.gstNumber}`);
  }
  if (data.business.location) {
    doc.fontSize(10).text(data.business.location);
  }
  doc.moveDown();

  doc
    .fontSize(16)
    .text("TAX INVOICE", { align: "right" })
    .fontSize(10)
    .text(`Invoice #: ${data.invoiceNumber}`, { align: "right" })
    .text(`Date: ${data.saleDate.toLocaleDateString("en-IN")}`, {
      align: "right",
    })
    .text(`Payment Status: ${data.paymentStatus}`, { align: "right" });

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();

  // --- Bill To ---
  if (data.customer) {
    doc.fontSize(11).text("Bill To:", { underline: true });
    doc.fontSize(10).text(data.customer.name);
    if (data.customer.phone) doc.text(`Phone: ${data.customer.phone}`);
    if (data.customer.address) doc.text(data.customer.address);
    doc.moveDown();
  }

  // --- Table header ---
  const tableTop = doc.y + 10;
  const colX = { item: 50, qty: 260, rate: 320, gst: 390, amount: 460 };

  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Item", colX.item, tableTop);
  doc.text("Qty", colX.qty, tableTop);
  doc.text("Rate", colX.rate, tableTop);
  doc.text("GST%", colX.gst, tableTop);
  doc.text("Amount", colX.amount, tableTop);

  doc
    .moveTo(50, tableTop + 15)
    .lineTo(545, tableTop + 15)
    .stroke();

  doc.font("Helvetica").fontSize(10);
  let y = tableTop + 22;

  data.items.forEach((item) => {
    doc.text(item.productName, colX.item, y, { width: 200 });
    doc.text(String(item.quantity), colX.qty, y);
    doc.text(`Rs.${item.unitPrice.toFixed(2)}`, colX.rate, y);
    doc.text(`${item.gstRatePercent}%`, colX.gst, y);
    doc.text(`Rs.${item.subtotal.toFixed(2)}`, colX.amount, y);
    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
  y += 15;

  // --- Totals ---
  const cgst = data.gstAmount / 2;
  const sgst = data.gstAmount / 2;

  doc.text(`Subtotal: Rs.${data.subtotal.toFixed(2)}`, colX.gst, y, {
    align: "left",
  });
  y += 15;
  doc.text(`CGST: Rs.${cgst.toFixed(2)}`, colX.gst, y);
  y += 15;
  doc.text(`SGST: Rs.${sgst.toFixed(2)}`, colX.gst, y);
  y += 15;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(`Total: Rs.${data.totalAmount.toFixed(2)}`, colX.gst, y);

  doc.moveDown(3);
  doc
    .font("Helvetica")
    .fontSize(8)
    .text("This is a system-generated invoice.", 50, doc.y, {
      align: "center",
      width: 495,
    });

  doc.end();
}