import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
    // Which login this is, so a password change can keep this one and log
    // out the others (see src/lib/auth.ts).
    sid: string;
  }

  interface User {
    id: string;
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    sid?: string;
    loginAt?: number;
  }
}
