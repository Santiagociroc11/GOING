"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    PackagePlus,
    ListOrdered,
    Truck,
    Route,
    Users,
    Settings,
    ClipboardList,
    Building2,
    DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";

type EffectiveSession = Session & { isImpersonating?: boolean };

type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

const ADMIN_NAV: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/admin/orders", label: "Flujo de Pedidos", icon: ClipboardList },
    { href: "/dashboard/admin/businesses", label: "Negocios", icon: Building2 },
    { href: "/dashboard/admin/drivers", label: "Domiciliarios", icon: Truck },
    { href: "/dashboard/admin/finance", label: "Finanzas", icon: DollarSign },
    { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
    { href: "/dashboard/admin/rates", label: "Tarifas", icon: Settings },
];

const BUSINESS_NAV: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/business/orders/new", label: "Nuevo Pedido", icon: PackagePlus },
    { href: "/dashboard/business/orders", label: "Mis Pedidos", icon: ListOrdered },
];

const DRIVER_NAV: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/driver/feed", label: "Buscar Pedidos", icon: Route },
    { href: "/dashboard/driver/orders", label: "Mis Entregas", icon: Truck },
];

export default function Sidebar({ effectiveSession }: { effectiveSession?: EffectiveSession | null }) {
    const pathname = usePathname();
    const role = (effectiveSession?.user as any)?.role;
    const isImpersonating = effectiveSession?.isImpersonating;

    const nav =
        role === "ADMIN" && !isImpersonating
            ? ADMIN_NAV
            : role === "BUSINESS"
              ? BUSINESS_NAV
              : role === "DRIVER"
                ? DRIVER_NAV
                : [];

    if (nav.length === 0) return null;

    return (
        <aside className="hidden md:block w-56 shrink-0 border-r bg-white/80 backdrop-blur-sm">
            <nav className="sticky top-20 flex flex-col gap-1 p-4">
                {nav.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-orange-50 text-orange-700"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-orange-600" : "text-gray-400")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
