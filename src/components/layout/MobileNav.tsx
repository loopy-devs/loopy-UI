import { NavLink } from 'react-router-dom';
import { Home, Shield, Send, ArrowLeftRight, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/shield', label: 'Shield', icon: Shield },
  { path: '/send', label: 'Send', icon: Send },
  { path: '/swap', label: 'Swap', icon: ArrowLeftRight },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient blur background */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/95 to-transparent pointer-events-none h-24 -top-8" />
      
      <div className="relative bg-bg-secondary border-t border-white/5 safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200',
                  'text-gray-500',
                  isActive && 'text-brand bg-brand/10'
                )
              }
            >
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center gap-1"
                >
                  <item.icon className={cn('h-6 w-6', isActive && 'drop-shadow-[0_0_8px_rgba(45,91,255,0.5)]')} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
