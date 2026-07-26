import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * NextAuth configuration — kept in lib/auth.ts so it can be imported
 * by API routes without triggering Next.js route-export type errors.
 */
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error('Please provide username and password');
                }

                await connectDB();

                const user = await User.findOne({ username: credentials.username }).select('+password');

                if (!user) {
                    throw new Error('No user found with this username');
                }

                const isValid = await bcrypt.compare(credentials.password, user.password!);

                if (!isValid) {
                    throw new Error('Incorrect password');
                }

                return {
                    id: user._id.toString(),
                    name: user.username,
                    email: user.email,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
