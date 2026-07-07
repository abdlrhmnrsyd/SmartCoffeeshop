import { Sidebar } from '@/components/layout/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar on desktop / mobile drawer */}
      <Sidebar />
      
      {/* Main viewport */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
