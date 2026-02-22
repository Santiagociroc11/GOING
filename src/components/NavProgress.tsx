"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Barra de progreso que se muestra al instante al hacer clic en un enlace interno.
 * Da feedback visual inmediato en móviles y dispositivos lentos donde la navegación tarda.
 */
export function NavProgress() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(false);
    }, [pathname]);

    useEffect(() => {
        if (!visible) return;
        const t = setTimeout(() => setVisible(false), 5000);
        return () => clearTimeout(t);
    }, [visible]);

    useEffect(() => {
        const isInternalLink = (el: HTMLElement | null): boolean => {
            const anchor = el?.closest("a[href]") as HTMLAnchorElement | null;
            if (!anchor) return false;
            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
            if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
            return href.startsWith("/") && !href.startsWith("//");
        };

        const handler = (e: Event) => {
            if (isInternalLink(e.target as HTMLElement)) setVisible(true);
        };

        document.addEventListener("click", handler, true);
        document.addEventListener("touchstart", handler, { passive: true, capture: true });
        return () => {
            document.removeEventListener("click", handler, true);
            document.removeEventListener("touchstart", handler, true);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-orange-500 animate-nav-progress"
            aria-hidden="true"
        />
    );
}
