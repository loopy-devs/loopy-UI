import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Header from './Header';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: 'linear-gradient(160deg, #14141f 0%, #0e0e14 40%, #10101a 70%, #151520 100%)'
      }}
    >
      {/* Desktop sidebar - fixed left */}
      <Sidebar />

      {/* Mobile header - sticky top */}
      <Header />

      {/* Main content area - centered with proper margins */}
      <main className="lg:pl-72 min-h-screen relative">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-24 lg:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
