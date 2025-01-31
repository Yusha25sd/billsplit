import Navbar from '@/components/NavbarDashboard';
import { Suspense } from 'react';
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
    </div>
    </Suspense>
  );
}
