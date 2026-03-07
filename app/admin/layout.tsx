import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Admin Portal - Virtual Try-On Kiosk",
    description: "Manage clothing items for the virtual try-on kiosk",
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Admin Header */}
            <header className="border-b bg-white shadow-sm">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-slate-900">
                            🛍️ Clothing Admin Portal
                        </h1>
                    </div>
                    <nav className="flex items-center gap-4">
                        <a
                            href="/"
                            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            View Kiosk →
                        </a>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    )
}
