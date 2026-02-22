"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

export default function DriverDashboardRedirect() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const check = async () => {
            const res = await fetch("/api/orders?limit=50");
            const data = await res.json();
            const list = data?.orders ?? (Array.isArray(data) ? data : []);
            if (Array.isArray(list)) {
                const active = list.filter((o: { status: string }) =>
                    ["ACCEPTED", "PICKED_UP"].includes(o.status)
                );
                if (active.length > 0) {
                    router.replace("/dashboard/driver/orders");
                    return;
                }
            }
            router.replace("/dashboard/driver/feed");
        };
        check().finally(() => setChecking(false));
    }, [router]);

    if (!checking) return null;
    return (
        <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-4">
                <Package className="h-12 w-12 text-orange-400 animate-pulse" />
                <p className="text-gray-500">Cargando...</p>
            </div>
        </div>
    );
}
