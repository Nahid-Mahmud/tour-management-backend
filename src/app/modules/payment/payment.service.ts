/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS } from "../booking/booking.interface";
import Booking from "../booking/booking.model";
import { PAYMENT_STATUS } from "./payment.interface";
import Payment from "./payment.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { generateInvoicePDF } from "../../utils/invoice";
import { ITour } from "../tour/tour.interface";
import { IUser } from "../user/user.interface";
import { sendEmail } from "../../utils/sendEmail";

const initPayment = async (bookingId: string) => {
  // Check if booking exists in the payment service
  const payment = await Payment.findOne({ booking: bookingId });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found. You have not booked this tour yet.");
  }

  const booking = await Booking.findById(payment.booking).populate("user", "name email phone address");

  const userAddress = (booking?.user as any).address as string;
  const userEmail = (booking?.user as any).email as string;
  const userPhone = (booking?.user as any).phone as string;
  const userName = (booking?.user as any).name as string;

  const sslPayload: ISSLCommerz = {
    address: userAddress,
    email: userEmail,
    name: userName,
    phoneNumber: userPhone,
    amount: payment.amount,
    transactionId: payment.transactionId,
  };

  const sslPayment = await SSLService.sslPaymentInit(sslPayload);

  return {
    paymentUrl: sslPayment.GatewayPageURL,
  };
};

const successPayment = async (query: Record<string, string>) => {
  // update booking status to confirm
  // update payment status to paid

  const session = await Booking.startSession();
  session.startTransaction();
  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      {
        transactionId: query.transactionId,
      },

      {
        status: PAYMENT_STATUS.PAID,
      },

      {
        session,
        new: true,
        runValidators: true,
      }
    );

    const updatedBooking = await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      {
        status: BOOKING_STATUS.COMPLETED,
      },
      {
        session,
        runValidators: true,
        new: true,
      }
    )
      .populate("tour", "title price")
      .populate("user", "name email");

    if (!updatedBooking) {
      throw new AppError(StatusCodes.NOT_FOUND, "Booking not found.");
    }

    if (!updatedPayment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Payment not found.");
    }

    const invoiceData = {
      bookingDate: updatedBooking?.createdAt as Date,
      guestCount: updatedBooking?.guestCount,
      totalAmount: updatedPayment?.amount,
      tourTitle: (updatedBooking?.tour as unknown as ITour).title,
      transactionId: updatedPayment?.transactionId,
      customerName: (updatedBooking?.user as unknown as IUser).name,
      customerEmail: (updatedBooking?.user as unknown as IUser).email,
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData);

    await sendEmail({
      to: (updatedBooking?.user as unknown as IUser).email,
      subject: "Your Tour Booking Invoice",
      templateName: "invoice.ejs",
      templateData: invoiceData,
      attachments: [
        {
          filename: "invoice.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    await session.commitTransaction();

    return {
      success: true,
      message: "Payment Completed Successfully",
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// function to handle failed payment
const failPayment = async (query: Record<string, string>) => {
  // Update booking status to FAIL
  // Update payment status to FAIL

  const session = await Booking.startSession();
  session.startTransaction();
  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      {
        transactionId: query.transactionId,
      },

      {
        status: PAYMENT_STATUS.FAILED,
      },

      {
        session,
        new: true,
        runValidators: true,
      }
    );

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      {
        status: BOOKING_STATUS.FAILED,
      },
      {
        session,
        runValidators: true,
      }
    );

    await session.commitTransaction();

    return {
      success: false,
      message: "Payment Failed",
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// function to handle cancel payment
const cancelPayment = async (query: Record<string, string>) => {
  // Update booking status to CANCEL
  // Update payment status to CANCEL
  const session = await Booking.startSession();
  session.startTransaction();
  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      {
        transactionId: query.transactionId,
      },

      {
        status: PAYMENT_STATUS.CANCELLED,
      },

      {
        session,
        new: true,
        runValidators: true,
      }
    );

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      {
        status: BOOKING_STATUS.CANCEL,
      },
      {
        session,
        runValidators: true,
      }
    );

    await session.commitTransaction();

    return {
      success: false,
      message: "Payment Cancelled ",
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const paymentService = {
  successPayment,
  failPayment,
  cancelPayment,
  initPayment,
};
