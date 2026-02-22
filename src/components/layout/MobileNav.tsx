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
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10"
                onClick={() => setOpen(true)}
                aria-label="Abrir menú"
            >
                <Menu className="h-6 w-6" />
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetHeader>
                    <span className="font-bold text-lg text-orange-600">Going</span>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar">
                        <X className="h-5 w-5" />
                    </Button>
                </SheetHeader>
                <SheetContent>
                    <nav className="flex flex-col gap-1">
                        {nav.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px]",
                                        isActive ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-100"
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
