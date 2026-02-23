"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    side?: "left" | "right";
}

export function Sheet({ open, onOpenChange, children, side = "left" }: SheetProps) {
    const [mounted, setMounted] = React.useState(false);
    const scrollYRef = React.useRef(0);

    React.useEffect(() => setMounted(true), []);

    React.useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onOpenChange]);

    React.useEffect(() => {
        if (!mounted) return;
        if (open) {
            scrollYRef.current = window.scrollY;
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollYRef.current}px`;
            document.body.style.left = "0";
            document.body.style.right = "0";
            document.body.style.width = "100%";
        } else {
            const y = scrollYRef.current;
            document.body.style.overflow = "";
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";
            window.scrollTo(0, y);
        }
        return () => {
            document.body.style.overflow = "";
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";
        };
    }, [open, mounted]);

    if (!open || !mounted || typeof document === "undefined") return null;

    const content = (
        <>
            <div
                role="button"
                tabIndex={0}
                className="fixed inset-0 z-[600] bg-black/50 md:hidden tap-clean cursor-pointer touch-manipulation animate-in fade-in duration-200"
                style={{ touchAction: "manipulation" }}
                onClick={() => onOpenChange(false)}
                onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
                aria-label="Cerrar menú"
            />
            <div
                className={cn(
                    "fixed top-0 z-[601] h-[100dvh] min-h-[100vh] w-72 max-w-[85vw] bg-white shadow-xl md:hidden flex flex-col animate-in slide-in-from-left duration-200",
                    "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
                    side === "left" ? "left-0" : "right-0"
                )}
                style={{ minHeight: "-webkit-fill-available" }}
            >
                {children}
            </div>
        </>
    );

    return createPortal(content, document.body);
}

export function SheetHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex items-center justify-between p-4 border-b shrink-0", className)} {...props}>
            {children}
        </div>
    );
}

export function SheetContent({ children, className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("p-4 overflow-y-auto overflow-x-hidden flex-1 overscroll-contain", className)}
            style={{ ...style, WebkitOverflowScrolling: "touch" }}
            {...props}
        >
            {children}
        </div>
    );
}
