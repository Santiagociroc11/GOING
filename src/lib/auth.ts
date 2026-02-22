import { getServerSession } from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const IMPERSONATE_COOKIE = "going_impersonate";

/** Sesión efectiva: si un admin está suplantando, devuelve la sesión del usuario suplantado */
export async function getEffectiveSession() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") return session;

    const cookieStore = await cookies();
    const raw = cookieStore.get(IMPERSONATE_COOKIE)?.value;
    if (!raw) return session;

    try {
        const { userId, userName, userEmail, userRole } = JSON.parse(decodeURIComponent(raw));
        if (!userId || !userRole) return session;

        return {
            ...session,
            user: {
                ...session.user,
                id: userId,
                name: userName,
                email: userEmail,
                role: userRole,
            },
            realUser: session.user,
            isImpersonating: true,
        };
    } catch {
        return session;
    }
}

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
                let user;

                try {
                    await dbConnect();
                    user = await User.findOne({
                        email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
                    });
                } catch (e) {
                    console.error("[Auth] MongoDB error:", e);
                    throw new Error("Error de conexión a la base de datos. Revisa MONGODB_URI.");
                }

                if (!user) {
                    console.log("[Auth] Usuario no encontrado para email:", email);
                    throw new Error("Invalid credentials");
                }

                if (!user.password) {
                    console.log("[Auth] Usuario sin contraseña:", user.email);
                    throw new Error("Invalid credentials");
                }

                const isBcryptHash = user.password.startsWith("$2");
                const isCorrectPassword = isBcryptHash
                    ? await bcrypt.compare(credentials.password, user.password)
                    : credentials.password === user.password;

                if (!isCorrectPassword) {
                    console.log("[Auth] Contraseña incorrecta para:", user.email, "| bcrypt:", isBcryptHash);
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
                // secure: true solo si la URL es HTTPS (evita fallos detrás de proxy)
                secure: (process.env.NEXTAUTH_URL || "").startsWith("https://"),
                maxAge: 30 * 24 * 60 * 60, // 30 días - persiste al cerrar el navegador
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
