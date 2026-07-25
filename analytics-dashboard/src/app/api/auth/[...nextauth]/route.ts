import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error('Please provide username and password');
                }

                await connectDB();

                // Query the user from MongoDB and explicitly select the password field
                const user = await User.findOne({ username: credentials.username }).select('+password');

                if (!user) {
                    throw new Error('No user found with this username');
                }

                // Compare password hashes
                const isValid = await bcrypt.compare(credentials.password, user.password!);

                if (!isValid) {
                    throw new Error('Incorrect password');
                }

                // Return the user object (NextAuth session will store this)
                return {
                    id: user._id.toString(),
                    name: user.username,
                    email: user.email,
                };
            }
        })
    ],
    session: {
        strategy: 'jwt', // JSON Web Tokens strategy
    },
    callbacks: {
        // Add user ID or database details to the session object
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
        }
    },
    pages: {
        signIn: '/login', // Redirects to our custom login page
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
