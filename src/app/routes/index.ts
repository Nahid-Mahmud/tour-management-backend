import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { divisionRoutes } from "../modules/division/division.routes";
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
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
