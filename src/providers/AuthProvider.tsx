"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";

const SESSION_STORAGE_KEY = "going_session";

function SessionSync() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "authenticated" && session) {
            try {
                localStorage.setItem(
                    SESSION_STORAGE_KEY,
                    JSON.stringify({
                        user: session.user,
                        expires: session.expires,
                    })
                );
            } catch {
                // localStorage no disponible (ej. modo incógnito)
            }
        } else if (status === "unauthenticated") {
            try {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            } catch {
                /* noop */
            }
        }
    }, [session, status]);

    return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider refetchInterval={0} refetchOnWindowFocus={true}>
            <SessionSync />
            {children}
        </SessionProvider>
    );
}
