"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    side?: "left" | "right";
}

export function Sheet({ open, onOpenChange, children, side = "left" }: SheetProps) {
    React.useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/50 md:hidden"
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />
            <div
                className={cn(
                    "fixed top-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-200 md:hidden",
                    side === "left" ? "left-0" : "right-0",
                    open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"
                )}
            >
                {children}
            </div>
        </>
    );
}

export function SheetHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex items-center justify-between p-4 border-b", className)} {...props}>
            {children}
        </div>
    );
}

export function SheetContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("p-4", className)} {...props}>
            {children}
        </div>
    );
}
