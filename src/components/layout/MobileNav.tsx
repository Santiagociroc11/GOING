"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetHeader, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getNavForRole } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";

type EffectiveSession = Session & { isImpersonating?: boolean };

export default function MobileNav({ effectiveSession }: { effectiveSession?: EffectiveSession | null }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const role = (effectiveSession?.user as any)?.role;
    const isImpersonating = effectiveSession?.isImpersonating;
    const nav = getNavForRole(role || "", isImpersonating);

    if (nav.length === 0) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Abrir menú"
                className="tap-clean md:hidden flex items-center justify-center h-10 w-10 -ml-1 rounded-lg text-gray-600 hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100 active:scale-95 transition-all duration-150 touch-manipulation"
            >
                <Menu className="h-5 w-5" />
            </button>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetHeader>
                    <span className="font-bold text-lg text-orange-600">Going</span>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Cerrar"
                        className="tap-clean flex items-center justify-center h-10 w-10 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 active:scale-95 transition-all duration-150 touch-manipulation"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </SheetHeader>
                <SheetContent>
                    <nav className="flex flex-col gap-0.5">
                        {nav.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "tap-clean flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors min-h-[48px] active:scale-[0.98] touch-manipulation",
                                        isActive ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-100 active:bg-gray-100"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-orange-600" : "text-gray-400")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </SheetContent>
            </Sheet>
        </>
    );
}
