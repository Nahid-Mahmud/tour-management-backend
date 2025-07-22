import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserRole } from "../user/user.interface";
import { BookingController } from "./booking.controller";
import { createBookingZodSchema, updateBookingZodSchema } from "./booking.validation";

const router = Router();

router.post(
  "/",
  checkAuth(...Object.values(UserRole)),
  validateRequest(createBookingZodSchema),
  BookingController.createBooking
);

// api/v1/booking
router.get("/", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), BookingController.getAllBookings);

// api/v1/booking/my-bookings
router.get("/my-bookings", checkAuth(...Object.values(UserRole)), BookingController.getUserBookings);

// api/v1/booking/bookingId
router.get("/:bookingId", checkAuth(...Object.values(UserRole)), BookingController.getSingleBooking);

// api/v1/booking/bookingId/status
router.patch(
  "/:bookingId/status",
  checkAuth(...Object.values(UserRole)),
  validateRequest(updateBookingZodSchema),
  BookingController.updateBookingStatus
);

const bookingRoute = router;

export default bookingRoute;
