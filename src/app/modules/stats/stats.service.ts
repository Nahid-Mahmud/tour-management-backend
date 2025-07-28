import Booking from "../booking/booking.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import Payment from "../payment/payment.model";
import { Tour } from "../tour/tour.model";
import { IsActive } from "../user/user.interface";
import User from "../user/user.model";

const now = new Date();

const sevenDaysAgo = new Date(now).setDate(now.getDate() - 7);
const thirtyDaysAgo = new Date(now).setDate(now.getDate() - 30);

// stats about  users
const getUserStats = async () => {
  const totalUsersPromise = User.countDocuments();
  const totalActiveUsersPromise = User.countDocuments({ isActive: IsActive.ACTIVE });
  const totalInActiveUsersPromise = User.countDocuments({ isActive: IsActive.INACTIVE });
  const totalBlockedUsersPromise = User.countDocuments({ isActive: IsActive.BLOCKED });
  const newUsersInLast7DaysPromise = User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });
  const newUsersInLast30DaysPromise = User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const usersByRolePromise = User.aggregate([
    // stage 1 - group by role and count total users in each
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    usersByRole,
  ] = await Promise.all([
    totalUsersPromise,
    totalActiveUsersPromise,
    totalInActiveUsersPromise,
    totalBlockedUsersPromise,
    newUsersInLast7DaysPromise,
    newUsersInLast30DaysPromise,
    usersByRolePromise,
  ]);

  return {
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    usersByRole,
  };
};

// get stats about tours
const getTourStats = async () => {
  const totalToursPromise = Tour.countDocuments();
  const totalToursByTourTypePromise = Tour.aggregate([
    // stage 1, connect tours with tourType with lookup
    {
      $lookup: {
        from: "tourtypes",
        localField: "tourType",
        foreignField: "_id",
        as: "type",
      },
    },
    // stage 2 - unwind the type array to get individual tour types
    {
      $unwind: "$type",
    },

    // state 3 - group by tour type and count total tours in each

    {
      $group: {
        _id: "$type.name",
        count: { $sum: 1 },
      },
    },
  ]);

  const averageTourCostPromise = Tour.aggregate([
    // stage 1 - group by tour type and calculate average cost
    {
      $group: {
        _id: "null",
        averageCost: { $avg: "$constFrom" },
      },
    },
  ]);

  const totalToursByDivisionPromise = Tour.aggregate([
    // stage 1, connect division
    {
      $lookup: {
        from: "divisions",
        localField: "division",
        foreignField: "_id",
        as: "division",
      },
    },
    // stage 2 - unwind the type array to get individual tour types
    {
      $unwind: "$division",
    },

    {
      $group: {
        _id: "$division.name",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalHighestBookedTourPromise = Booking.aggregate([
    // stage 1 grout the tour

    {
      $group: {
        _id: "$tour",
        bookingCount: { $sum: 1 },
      },
    },
    //  stage 2 -sort the tour

    {
      $sort: {
        bookingCount: -1,
      },
    },

    // stage 3 - limit to top 5 tours
    {
      $limit: 5,
    },

    // stage 4 - lookup to get tour details
    {
      $lookup: {
        from: "tours",
        let: { tour: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$tour"],
              },
            },
          },
        ],
        as: "tourDetails",
      },
    },

    //    stage 5 - unwind the tour details array
    {
      $unwind: "$tourDetails",
    },
    {
      $project: {
        _id: 0,
        tourId: "$tourDetails._id",
        tourName: "$tourDetails.name",
        bookingCount: 1,
        title: "$tourDetails.title",
        description: "$tourDetails.description",
        slug: "$tourDetails.slug",
      },
    },
  ]);

  const [totalTours, totalToursByTourType, averageTourCost, totalToursByDivision, totalHighestBookedTour] =
    await Promise.all([
      totalToursPromise,
      totalToursByTourTypePromise,
      averageTourCostPromise,
      totalToursByDivisionPromise,
      totalHighestBookedTourPromise,
    ]);

  return {
    totalTours,
    totalToursByTourType,
    averageTourCost,
    totalToursByDivision,
    totalHighestBookedTour,
  };
};

//  get stats about bookings
const getBookingStats = async () => {
  const totalBookingsPromise = Booking.countDocuments();
  const totalBookingByStatusPromise = Booking.aggregate([
    // stage 1 - group by status and count total bookings in each
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const bookingsPerTourPromise = Booking.aggregate([
    // state 1 - group
    {
      $group: {
        _id: "$tour",
        bookingCount: { $sum: 1 },
      },
    },

    // stage 2 - Sort

    {
      $sort: {
        bookingCount: -1,
      },
    },

    // stage 3 - limit to top 10 tours
    {
      $limit: 10,
    },

    // stage 4 - lookup to get tour details
    {
      $lookup: {
        from: "tours",
        localField: "_id",
        foreignField: "_id",
        as: "tourDetails",
      },
    },

    // stage 5  - unwind the tour details array
    {
      $unwind: "$tourDetails",
    },

    // stage 6 - project the required fields
    {
      $project: {
        bookingCount: 1,
        _id: 1,
        tourId: "$tourDetails._id",
        tourName: "$tourDetails.name",
        title: "$tourDetails.title",
        description: "$tourDetails.description",
        slug: "$tourDetails.slug",
      },
    },
  ]);

  const averageGuestPerBookingPromise = Booking.aggregate([
    {
      $group: {
        _id: null,
        avgGuestCount: { $avg: "$guestCount" },
      },
    },
    {
      $project: {
        _id: 0,
        avgGuestCount: { $round: ["$avgGuestCount", 5] },
      },
    },
  ]);

  const bookingPerLast7DaysPromise = Booking.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });
  const bookingPerLast30DaysPromise = Booking.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const totalBookingByUniqueUsersPromise = Booking.distinct("user").then((user) => user.length);

  const [
    totalBookings,
    totalBookingByStatus,
    bookingsPerTour,
    averageGuestPerBooking,
    bookingPerLast7Days,
    bookingPerLast30Days,
    totalBookingsByUniqueUsers,
  ] = await Promise.all([
    totalBookingsPromise,
    totalBookingByStatusPromise,
    bookingsPerTourPromise,
    averageGuestPerBookingPromise,
    bookingPerLast7DaysPromise,
    bookingPerLast30DaysPromise,
    totalBookingByUniqueUsersPromise,
  ]);

  return {
    totalBookings,
    totalBookingByStatus,
    bookingsPerTour,
    averageGuestPerBooking,
    bookingPerLast7Days,
    bookingPerLast30Days,
    totalBookingsByUniqueUsers,
  };
};

// get stats about payments
const getPaymentStats = async () => {
  const totalPaymentsPromise = Payment.countDocuments();

  const totalPaymentByStatusPromise = Payment.aggregate([
    {
      // group by status and count total payments in each

      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $unwind: "$_id",
    },
  ]);

  const totalRevenuePromise = Payment.aggregate([
    // stage 1 - match payments
    {
      $match: {
        status: PAYMENT_STATUS.PAID, // exclude pending payments
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
      },
    },
  ]);

  const averagePaymentAmountPromise = Payment.aggregate([
    // group
    {
      $group: {
        _id: null,
        averagePaymentAmount: { $avg: "$amount" },
      },
    },
  ]);

  const paymentGatewayDataPromise = Payment.aggregate([
    // stage group
    {
      $group: {
        _id: {
          $ifNull: ["$paymentGatewayData.status", "Unknown"],
        },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  const [totalPayments, totalRevenue, totalPaymentByStatus, averagePaymentAmount, paymentGatewayData] =
    await Promise.all([
      totalPaymentsPromise,
      totalRevenuePromise,
      totalPaymentByStatusPromise,
      averagePaymentAmountPromise,
      paymentGatewayDataPromise,
    ]);

  return {
    totalPayments,
    totalRevenue,
    totalPaymentByStatus,
    averagePaymentAmount,
    paymentGatewayData,
  };
};
export const statsService = {
  getBookingStats,
  getTourStats,
  getUserStats,
  getPaymentStats,
};
