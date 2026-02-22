"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Package, Route, Settings, UserCircle, Users } from "lucide-react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-orange-600">
                    <Package className="h-6 w-6" />
                    Going
                </Link>

                {session ? (
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
                            {(session?.user as any)?.role === "ADMIN" && (
                                <>
                                    <Link href="/dashboard/admin/users" className="hover:text-orange-600 flex items-center gap-1">
                                        <Users className="h-4 w-4" /> Usuarios
                                    </Link>
                                    <Link href="/dashboard/admin/rates" className="hover:text-orange-600 flex items-center gap-1">
                                        <Settings className="h-4 w-4" /> Tarifas
                                    </Link>
                                </>
                            )}
                            {(session?.user as any)?.role === "BUSINESS" && (
                                <Link href="/dashboard/business/orders/new" className="hover:text-orange-600 flex items-center gap-1">
                                    <Package className="h-4 w-4" /> Nuevo Pedido
                                </Link>
                            )}
                            {(session?.user as any)?.role === "DRIVER" && (
                                <Link href="/dashboard/driver/feed" className="hover:text-orange-600 flex items-center gap-1">
                                    <Route className="h-4 w-4" /> Buscar Pedidos
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-3 border-l pl-6">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <UserCircle className="h-5 w-5 text-gray-400" />
                                <span className="hidden sm:inline-block">{session.user?.name}</span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 border">
                                    {(session.user as any)?.role}
                                </span>
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })} title="Cerrar Sesión">
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
