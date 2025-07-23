import { BOOKING_STATUS } from "../booking/booking.interface";
import Booking from "../booking/booking.model";
import { PAYMENT_STATUS } from "./payment.interface";
import Payment from "./payment.model";

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

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      {
        status: BOOKING_STATUS.COMPLETED,
      },
      {
        session,
        new: true,
        runValidators: true,
      }
    );

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

const failPayment = async () => {
  // Update booking status to FAIL
  // Update payment status to FAIL
};

const cancelPayment = async () => {
  // Update booking status to CANCEL
  // Update payment status to CANCEL
};

export const paymentService = {
  successPayment,
  failPayment,
  cancelPayment,
};
