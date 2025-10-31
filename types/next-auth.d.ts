import { getToken } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    tokenType: string;
  }
  interface TokenSet {
    token_type: string;
  }
}

declare const getToken: (options: {
  req: NextRequest;
  secret: string;
}) => Promise<JWT | null>;
