import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    isAdmin: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    isAdmin?: boolean;
  }
}
