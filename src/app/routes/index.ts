import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import bookingRoute from "../modules/booking/booking.route";
import { divisionRoutes } from "../modules/division/division.routes";
import { otpRoutes } from "../modules/otp/otp.routes";
import paymentRoutes from "../modules/payment/payment.route";
import { TourRoutes } from "../modules/tour/tour.route";
import { userRoutes } from "../modules/user/user.route";

export const router = Router();

interface IModuleRoute {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRoute[] = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/division",
    route: divisionRoutes,
  },
  {
    path: "/tour",
    route: TourRoutes,
  },
  {
    path: "/booking",
    route: bookingRoute,
  },
  {
    path: "/payment",
    route: paymentRoutes,
  },
  {
    path: "/otp",
    route: otpRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
