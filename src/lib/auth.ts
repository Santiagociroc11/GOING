import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
    ...(process.env.AUTH_TRUST_HOST !== "false" && { trustHost: true } as object),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email?.trim() || !credentials.password) {
                    throw new Error("Invalid credentials");
                }

                const email = credentials.email.trim().toLowerCase();
                await dbConnect();

                // Búsqueda case-insensitive por email (evita Admin@ vs admin@)
                const user = await User.findOne({
                    email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
                });

                if (!user) {
                    throw new Error("Invalid credentials");
                }

                if (!user.password) {
                    throw new Error("Invalid credentials");
                }

                // Soporta bcrypt hash o contraseña en texto plano
                const isBcryptHash = user.password.startsWith("$2");
                const isCorrectPassword = isBcryptHash
                    ? await bcrypt.compare(credentials.password, user.password)
                    : credentials.password === user.password;

                if (!isCorrectPassword) {
                    throw new Error("Invalid credentials");
                }

                if (user.active === false) {
                    throw new Error("Tu cuenta ha sido desactivada. Contacta al administrador.");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 días
        updateAge: 24 * 60 * 60, // Refrescar cada 24h
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60, // 30 días - persiste al cerrar el navegador
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
