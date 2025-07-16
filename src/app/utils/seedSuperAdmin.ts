/* eslint-disable no-console */
import envVariables from "../config/env";
import { IAuthProvider, IUser, UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";
import { hashPassword } from "./hashPassword";

export const seedSuperAdmin = async () => {
  try {
    // console.log("object");

    // check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: envVariables.SUPER_ADMIN_EMAIL });

    if (existingSuperAdmin) {
      console.log("Super admin already exists.");
      return;
    }

    const password = await hashPassword(envVariables.SUPER_ADMIN_PASSWORD);

    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: envVariables.SUPER_ADMIN_EMAIL as string,
    };

    const payload: Partial<IUser> = {
      name: "Super Admin",
      email: envVariables.SUPER_ADMIN_EMAIL,
      role: UserRole.SUPER_ADMIN,
      password,
      isVerified: true,
      auths: [authProvider],
    };

    await User.create(payload);
    console.log("Super admin seeded successfully.");
  } catch (error) {
    console.error("Error seeding super admin:", error);
  }
};
