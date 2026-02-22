"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Package, Route, Settings, UserCircle, Users, UserX } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";
import type { Session } from "next-auth";

type EffectiveSession = Session & { isImpersonating?: boolean; realUser?: Session["user"] };

export default function Navbar({ effectiveSession }: { effectiveSession?: EffectiveSession | null }) {
    const { data: session } = useSession();
    const displaySession = effectiveSession ?? session;
    const isImpersonating = effectiveSession?.isImpersonating;

    const stopImpersonation = async () => {
        await fetch("/api/admin/impersonate/stop", { method: "POST" });
        window.location.href = "/dashboard";
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
            {isImpersonating && (
                <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-amber-800">
                        Suplantando a <strong>{displaySession?.user?.name}</strong>
                    </span>
                    <Button variant="outline" size="sm" onClick={stopImpersonation} className="border-amber-400 text-amber-800 hover:bg-amber-200">
                        <UserX className="h-4 w-4 mr-1" /> Salir de suplantación
                    </Button>
                </div>
            )}
            <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <MobileNav effectiveSession={effectiveSession} />
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl sm:text-2xl tracking-tighter text-orange-600 shrink-0">
                        <Package className="h-5 w-5 sm:h-6 w-6" />
                        Going
                    </Link>
                </div>

                {displaySession ? (
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
                            {(displaySession?.user as any)?.role === "ADMIN" && !isImpersonating && (
                                <>
                                    <Link href="/dashboard/admin/orders" className="hover:text-orange-600 flex items-center gap-1">
                                        <Package className="h-4 w-4" /> Pedidos
                                    </Link>
                                    <Link href="/dashboard/admin/users" className="hover:text-orange-600 flex items-center gap-1">
                                        <Users className="h-4 w-4" /> Usuarios
                                    </Link>
                                    <Link href="/dashboard/admin/rates" className="hover:text-orange-600 flex items-center gap-1">
                                        <Settings className="h-4 w-4" /> Tarifas
                                    </Link>
                                </>
                            )}
                            {(displaySession?.user as any)?.role === "BUSINESS" && (
                                <Link href="/dashboard/business/orders/new" className="hover:text-orange-600 flex items-center gap-1">
                                    <Package className="h-4 w-4" /> Nuevo Pedido
                                </Link>
                            )}
                            {(displaySession?.user as any)?.role === "DRIVER" && (
                                <Link href="/dashboard/driver/feed" className="hover:text-orange-600 flex items-center gap-1">
                                    <Route className="h-4 w-4" /> Buscar Pedidos
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 border-l pl-4 sm:pl-6">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <UserCircle className="h-5 w-5 text-gray-400" />
                                <span className="hidden sm:inline-block">{displaySession.user?.name}</span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 border">
                                    {(displaySession.user as any)?.role}
                                </span>
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                    await signOut({ redirect: false });
                                    window.location.href = "/login";
                                }}
                                title="Cerrar Sesión"
                            >
                                <LogOut className="h-5 w-5 text-red-500" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link href="/login">
                            <Button variant="ghost">Iniciar Sesión</Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-orange-600 hover:bg-orange-700">Empezar</Button>
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
