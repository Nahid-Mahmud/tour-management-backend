import { Router } from "express";
import { userRoutes } from "../user/user.route";

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
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
