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
    History,
    Bell,
} from "lucide-react";

export type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

export const ADMIN_NAV: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/admin/orders", label: "Flujo de Pedidos", icon: ClipboardList },
    { href: "/dashboard/admin/businesses", label: "Negocios", icon: Building2 },
    { href: "/dashboard/admin/drivers", label: "Domiciliarios", icon: Truck },
    { href: "/dashboard/admin/finance", label: "Finanzas", icon: DollarSign },
    { href: "/dashboard/admin/audit", label: "Historial Admin", icon: History },
    { href: "/dashboard/admin/notifications", label: "Notificaciones", icon: Bell },
    { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
    { href: "/dashboard/admin/rates", label: "Tarifas", icon: Settings },
];

export const BUSINESS_NAV: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/business/orders/new", label: "Nuevo Pedido", icon: PackagePlus },
    { href: "/dashboard/business/orders", label: "Mis Pedidos", icon: ListOrdered },
];

export const DRIVER_NAV: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/driver/feed", label: "Buscar Pedidos", icon: Route },
    { href: "/dashboard/driver/orders", label: "Mis Entregas", icon: Truck },
];

export function getNavForRole(role: string, isImpersonating?: boolean): NavItem[] {
    if (role === "ADMIN" && !isImpersonating) return ADMIN_NAV;
    if (role === "BUSINESS") return BUSINESS_NAV;
    if (role === "DRIVER") return DRIVER_NAV;
    return [];
}
