import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { PushSubscriptionSync } from "@/components/PushSubscriptionSync";
import { getEffectiveSession } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const effectiveSession = await getEffectiveSession();
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PushSubscriptionSync />
            <Navbar effectiveSession={effectiveSession} />
            <div className="flex flex-1">
                <Sidebar effectiveSession={effectiveSession} />
                <main className="flex-1 min-w-0 container mx-auto px-3 sm:px-4 py-6 sm:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
