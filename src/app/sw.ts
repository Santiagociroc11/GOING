import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    fallbacks: {
        entries: [
            {
                url: "/~offline",
                matcher({ request }) {
                    return request.destination === "document";
                },
            },
        ],
    },
});

serwist.addEventListeners();

self.addEventListener("push", (event) => {
    if (!event.data) return;
    event.waitUntil(
        event.data
            .json()
            .catch(() => ({}))
            .then((data: { title?: string; body?: string; url?: string }) => {
                const title = data.title || "Going";
                const options: NotificationOptions = {
                    body: data.body || "",
                    icon: "/icons/192",
                    badge: "/icons/192",
                    data: { url: data.url || "/" },
                };
                return self.registration.showNotification(title, options);
            })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = (event.notification.data as { url?: string })?.url || "/";
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            const target = clients.find((c) => c.url.includes(self.location.origin) && "focus" in c);
            if (target) {
                target.navigate(url);
                target.focus();
            } else if (clients.length) {
                clients[0].navigate(url);
                clients[0].focus();
            } else if (self.clients.openWindow) {
                self.clients.openWindow(url);
            }
        })
    );
});
