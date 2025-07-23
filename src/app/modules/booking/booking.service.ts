/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import User from "../user/user.model";
import { BOOKING_STATUS, IBooking } from "./booking.interface";
import Booking from "./booking.model";
import Payment from "../payment/payment.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import crypto from "crypto";
import { Tour } from "../tour/tour.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";

// function to crate a unique transaction ID
const getTransactionId = () => {
  // const date = Date.now();
  // const randomNumber = Math.floor(Math.random() * 1000);
  const cryptoId = crypto.randomBytes(12).toString("hex");
  return `tran_${cryptoId}`;
};

const createBooking = async (payload: Partial<IBooking>, userId: string) => {
  const session = await Booking.startSession();

  // validate payload
  if (!payload.guestCount || payload.guestCount <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Guest count must be a positive integer");
  }

  const transactionId = getTransactionId();

  // start session
  session.startTransaction();
  try {
    const user = await User.findById(userId);
    if (!user?.phone || !user?.address) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Please Update you profile with phone and address");
    }

    const tour = await Tour.findById(payload.tour).select("constFrom");

    if (!tour?.constFrom) {
      throw new AppError(StatusCodes.NOT_FOUND, "Tour not found");
    }

    const amount = Number(tour.constFrom) * Number(payload.guestCount);

    const booking = await Booking.create(
      [
        {
          user: userId,
          status: BOOKING_STATUS.PENDING,
          ...payload,
        },
      ],
      { session }
    );

    const payment = await Payment.create(
      [
        {
          booking: booking[0]._id,
          status: PAYMENT_STATUS.UNPAID,
          transactionId: transactionId,
          amount: amount,
        },
      ],
      { session }
    );

    const updatedBooking = await Booking.findByIdAndUpdate(
      booking[0]._id,
      {
        payment: payment[0]._id,
      },
      {
        new: true,
        runValidators: true,
        session: session,
      }
    )
      .populate("user", "name email phone address")
      .populate("tour", "title constFrom")
      .populate("payment");

    const userAddress = (updatedBooking?.user as any).address as string;

    const userEmail = (updatedBooking?.user as any).email as string;

    const userPhone = (updatedBooking?.user as any).phone as string;
    const userName = (updatedBooking?.user as any).name as string;

    const sslPayload: ISSLCommerz = {
      address: userAddress,
      email: userEmail,
      name: userName,
      phoneNumber: userPhone,
      amount: amount,
      transactionId: transactionId,
    };

    const sslPayment = await SSLService.sslPaymentInit(sslPayload);
    // console.log(sslPayment);

    await session.commitTransaction();

    return {
      booking: updatedBooking,
      payment: sslPayment,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // check for phone and address
};

const getUserBookings = async () => {
  return {};
};

const getBookingById = async () => {
  return {};
};
const updateBookingStatus = async () => {
  return {};
};
const getAllBookings = async () => {
  return {};
};
export const BookingService = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  getAllBookings,
};
