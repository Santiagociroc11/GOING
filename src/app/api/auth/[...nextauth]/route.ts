import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

if (!process.env.NEXTAUTH_SECRET) {
    console.error("NEXTAUTH_SECRET no está definido. El login fallará.");
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
