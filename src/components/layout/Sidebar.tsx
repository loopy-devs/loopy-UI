import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Shield, ArrowLeftRight, User, LogOut, Send, Download } from 'lucide-react';
import { useDisconnect } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';
import { useCacheStore } from '@/stores/cache';

const navItems = [
  { path: '/dashboard', label: 'Portfolio', icon: Home },
  { path: '/shield', label: 'Shield', icon: Shield },
  { path: '/send', label: 'Send', icon: Send },
  { path: '/receive', label: 'Receive', icon: Download },
  { path: '/swap', label: 'Swap', icon: ArrowLeftRight },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const logout = useAuthStore((s) => s.logout);
  const invalidateAll = useCacheStore((s) => s.invalidateAll);

  const handleDisconnect = async () => {
    // Disconnect wallet first
    await disconnect();
    
    // Clear Zustand stores
    logout();
    invalidateAll();
    
    // IMPORTANT: Explicitly clear ALL localStorage to ensure fresh state
    localStorage.removeItem('loopy-auth');
    localStorage.removeItem('loopy-cache');
    
    // Clear any AppKit/Reown related storage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('appkit') || key.includes('reown') || key.includes('walletconnect') || key.includes('wc@'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage too
    sessionStorage.clear();
    
    // Navigate to onboarding
    navigate('/');
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen bg-bg-secondary border-r border-white/5 fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <img src="/logo.svg" alt="Loopy" className="h-11 w-11" />
          <div>
            <span className="text-xl font-bold text-white tracking-tight">Loopy</span>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Privacy Protocol</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    'text-gray-400 hover:text-white hover:bg-white/5',
                    isActive && 'bg-brand/10 text-white border border-brand/20'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Disconnect */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-500 hover:text-error hover:bg-error/5 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-sm">Disconnect</span>
        </button>
      </div>
    </aside>
  );
}
