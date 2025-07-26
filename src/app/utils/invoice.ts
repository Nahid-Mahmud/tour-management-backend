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

export const generateInvoicePDF = async (invoiceData: InvoiceData) => {
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

      // PDF Content

      //   header
      doc.fontSize(20).text("Invoice", { align: "center" });
      doc.moveDown();

      // Invoice Details
      doc.fontSize(14).text(`Transaction Number: ${invoiceData.transactionId}`, { align: "left" });
      doc.text(`Booking Date: ${invoiceData.bookingDate.toLocaleDateString()}`, { align: "left" });
      doc.text(`Customer Name: ${invoiceData.customerName}`, { align: "left" });
      doc.moveDown();
      // Customer Details
      doc.text(`Customer Email: ${invoiceData.customerEmail}`, { align: "center" });
      doc.text(`Tour Title: ${invoiceData.tourTitle}`, { align: "center" });
      doc.text(`Guest Count: ${invoiceData.guestCount}`, { align: "center" });
      doc.text(`Total Amount: ${invoiceData.totalAmount.toFixed(2)}`, { align: "center" });

      // Footer
      doc.moveDown();
      doc.fontSize(10).text("Thank you for booking with us.", { align: "center" });
      doc.text("If you have any questions, please contact us.", { align: "center" });

      // Finalize the PDF and end the stream
      doc.end();
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error generating invoice PDF:", error);
    throw new AppError(HttpStatusCode.InternalServerError, `Failed to generate invoice PDF: ${error.message}`);
  }
};
