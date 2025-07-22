import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import BookingRoute from "../modules/booking/booking.route";
import { divisionRoutes } from "../modules/division/division.routes";
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
    route: BookingRoute,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
