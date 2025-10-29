import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';
import { AuthResponse } from '@/types/auth';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const response = await axios.post<AuthResponse>(`${backendUrl}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          if (response.data?.user) {
            return {
              ...response.data.user,
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            } as any;
          }
        } catch (error: any) {
          throw new Error(error?.response?.data?.message || 'Invalid credentials');
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.user) {
        session.user = token.user as any;
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

