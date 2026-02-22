import Navbar from "@/components/layout/Navbar";
import { getEffectiveSession } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const effectiveSession = await getEffectiveSession();
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar effectiveSession={effectiveSession} />
            <main className="flex-1 container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
