import NextAuth, { DefaultSession } from 'next-auth';
import { Role } from './common';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
    };
  }
}
