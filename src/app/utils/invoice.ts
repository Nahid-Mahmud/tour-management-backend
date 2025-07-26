/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";
import { HttpStatusCode } from "axios";

export interface InvoiceData {
  transactionId: string;
  bookingDate: Date;
  customerName: string;
  customerEmail: string;
  //   customerPhone: string;
  tourTitle: string;
  guestCount: number;
  totalAmount: number;
}

export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<Buffer> => {
  try {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const buffers: Uint8Array[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (error) => reject(error));

      // Colors
      const primaryColor = "#2c3e50";
      const secondaryColor = "#7f8c8d";
      const accentColor = "#3498db";

      // Header
      doc.font("Helvetica-Bold").fontSize(24).fillColor(primaryColor).text("Invoice", { align: "center" });

      doc.moveDown(2);

      // Section Title
      doc.font("Helvetica-Bold").fontSize(14).fillColor(primaryColor).text("Invoice Details", { underline: true });

      doc.moveDown(1);

      // Invoice Detail Fields
      const details = [
        { label: "Transaction Number:", value: invoiceData.transactionId },
        { label: "Booking Date:", value: invoiceData.bookingDate.toLocaleDateString() },
        { label: "Customer Name:", value: invoiceData.customerName },
        { label: "Customer Email:", value: invoiceData.customerEmail },
        { label: "Tour Title:", value: invoiceData.tourTitle },
        { label: "Guest Count:", value: invoiceData.guestCount.toString() },
        { label: "Total Amount:", value: `$${invoiceData.totalAmount.toFixed(2)}` },
      ];

      const labelX = 50;
      // const valueX = 200;
      const labelWidth = 140; // Fixed width for labels
      let currentY = doc.y;

      details.forEach(({ label, value }) => {
        doc.font("Helvetica-Bold").fontSize(12).fillColor(primaryColor).text(label, labelX, currentY);

        doc
          .font("Helvetica")
          .fontSize(12)
          .fillColor(secondaryColor)
          .text(value, labelX + labelWidth, currentY);

        currentY += 20;
      });

      // Separator Line
      doc
        .moveTo(50, currentY + 10)
        .lineTo(550, currentY + 10)
        .strokeColor(accentColor)
        .lineWidth(1)
        .stroke();

      const footerText1 = "Thank you for booking with us.";
      const footerText2 = "If you have any questions, please contact us.";

      // Perfect center by using full width and alignment
      doc
        .moveDown(2)
        .font("Helvetica-Oblique")
        .fontSize(10)
        .fillColor(secondaryColor)
        .text(footerText1, 50, doc.y, { width: 500, align: "center" })
        .text(footerText2, 50, doc.y, { width: 500, align: "center" });

      // Border around the page
      doc.lineWidth(0.5).strokeColor(secondaryColor).rect(30, 30, 535, 732).stroke();

      // Finalize
      doc.end();
    });
  } catch (error: any) {
    // console.error("Error generating invoice PDF:", error);
    throw new AppError(HttpStatusCode.InternalServerError, `Failed to generate invoice PDF: ${error.message}`);
  }
};
