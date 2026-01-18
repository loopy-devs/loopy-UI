import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Copy, Check, Gift, Trophy, LogOut, ExternalLink, 
  Share2, Sparkles, Zap, Users 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth';
import { useCacheStore } from '@/stores/cache';
import { truncateAddress } from '@/lib/format';
import { cn } from '@/lib/cn';

interface ReferralStats {
  referral_code: string;
  points: number;
  total_referrals: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { address } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const invalidateAll = useCacheStore((s) => s.invalidateAll);

  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);

  // Fetch referral stats from API
  useEffect(() => {
    const fetchStats = async () => {
      if (!address) return;
      
      try {
        const res = await fetch(`/api/referral/stats/${address}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch referral stats:', err);
      }
    };

    fetchStats();
  }, [address]);

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

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

  const shareReferral = async () => {
    const referralLink = `${window.location.origin}/?ref=${user?.referral_code}`;
    if (navigator.share) {
      await navigator.share({
        title: 'Join Loopy - Private DeFi on Solana',
        text: 'Use my referral code to get started with private transactions on Solana!',
        url: referralLink,
      });
    } else {
      copyToClipboard(referralLink, 'link');
    }
  };

  const referralLink = `${window.location.origin}/?ref=${user?.referral_code}`;
  // Use fresh stats from API, fallback to user store
  const points = stats?.points ?? user?.points ?? 0;
  const referralCount = stats?.total_referrals ?? 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Desktop: 2-column grid layout, Mobile: single column */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        
        {/* Left Column - Profile Info (Desktop: 5 cols, Mobile: full) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Profile Header with Gradient Avatar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card animate={false} className="border-white/5 overflow-hidden">
              <div className="relative p-6 lg:p-8 text-center">
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-white/5 pointer-events-none" />
                
                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="relative inline-block"
                >
                  <div className="h-24 w-24 lg:h-28 lg:w-28 rounded-2xl bg-gradient-to-br from-brand via-blue-400 to-cyan-400 p-[2px]">
                    <div className="h-full w-full rounded-2xl bg-bg-primary flex items-center justify-center">
                      <User className="h-10 w-10 lg:h-12 lg:w-12 text-brand" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-success border-3 border-bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </motion.div>

                {/* Address */}
                <div className="relative mt-5">
                  <h1 className="text-xl lg:text-2xl font-bold text-white">
                    {address ? truncateAddress(address, 6) : 'Not Connected'}
                  </h1>
                  <a
                    href={`https://solscan.io/account/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-brand transition-colors mt-2"
                  >
                    View on Solscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Disconnect Button - Inside profile card on desktop */}
                <button
                  onClick={handleDisconnect}
                  className={cn(
                    'relative z-10 mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl',
                    'bg-red-500/10 border border-red-500/20',
                    'text-red-400 text-sm font-medium',
                    'hover:bg-red-500/20 hover:border-red-500/30 transition-all cursor-pointer'
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect Wallet
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Stats Cards - Side by side on desktop too */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            <Card animate={false} className="border-white/5">
              <CardContent className="p-4 lg:p-5 text-center">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-white">{referralCount}</p>
                <p className="text-xs text-gray-500 mt-1">Referrals</p>
              </CardContent>
            </Card>
            
            <Card animate={false} className="border-white/5">
              <CardContent className="p-4 lg:p-5 text-center">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-cyan-400" />
                </div>
                <p className="text-3xl font-bold text-white">0</p>
                <p className="text-xs text-gray-500 mt-1">Transactions</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* How to Earn Points - Desktop only in left column */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:block"
          >
            <Card animate={false} className="border-white/5">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-brand" />
                  How to Earn Points
                </h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-400">Refer a friend</span>
                  <span className="text-sm font-semibold text-green-400">+50 pts</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Share your referral code to earn points for each signup
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Points & Referral (Desktop: 7 cols, Mobile: full) */}
        <div className="lg:col-span-7 space-y-5 mt-5 lg:mt-0">
          {/* Points Card - Premium Gradient */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card animate={false} className="overflow-hidden border-0">
              <div className="relative bg-gradient-to-br from-brand/20 via-blue-600/10 to-white/5 p-6 lg:p-8">
                {/* Animated sparkles */}
                <div className="absolute top-4 right-4">
                  <Sparkles className="h-5 w-5 text-brand/50 animate-pulse" />
                </div>
                <div className="absolute bottom-6 right-12">
                  <Sparkles className="h-3 w-3 text-cyan-400/50 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
                <div className="absolute top-1/2 right-6">
                  <Sparkles className="h-4 w-4 text-blue-400/30 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-brand/20 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-brand" />
                    </div>
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Your Points</span>
                  </div>
                  
                  <div className="flex items-end gap-3">
                    <span className="text-6xl lg:text-7xl font-bold text-white tracking-tight">
                      {points.toLocaleString()}
                    </span>
                    <span className="text-xl text-gray-400 mb-3">pts</span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mt-5">
                    Points convert to <span className="text-brand font-semibold">$LOOPY</span> tokens at TGE
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Referral Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card animate={false} className="border-white/5 overflow-hidden">
              {/* Header */}
              <div className="p-4 lg:p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-brand/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Invite Friends</h3>
                    <p className="text-xs text-gray-500">Earn 50 points per referral</p>
                  </div>
                </div>
                <button
                  onClick={shareReferral}
                  className="h-10 px-5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
              
              <CardContent className="p-4 lg:p-5 space-y-4">
                {/* Referral Code */}
                <button
                  onClick={() => copyToClipboard(user?.referral_code || '', 'code')}
                  className={cn(
                    'w-full flex items-center justify-between p-5 rounded-xl',
                    'bg-bg-tertiary/50 border border-white/5',
                    'hover:border-brand/30 hover:bg-bg-tertiary transition-all group'
                  )}
                >
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Your Referral Code</p>
                    <p className="font-mono text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand to-cyan-400 tracking-widest">
                      {user?.referral_code || '------'}
                    </p>
                  </div>
                  <div className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center transition-all',
                    copied === 'code' ? 'bg-success/20' : 'bg-white/5 group-hover:bg-brand/20'
                  )}>
                    {copied === 'code' ? (
                      <Check className="h-6 w-6 text-success" />
                    ) : (
                      <Copy className="h-6 w-6 text-gray-400 group-hover:text-brand" />
                    )}
                  </div>
                </button>

                {/* Referral Link */}
                <button
                  onClick={() => copyToClipboard(referralLink, 'link')}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl',
                    'bg-bg-tertiary/30 border border-white/5',
                    'hover:border-brand/30 hover:bg-bg-tertiary/50 transition-all group'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-400 truncate">
                      {referralLink}
                    </span>
                  </div>
                  {copied === 'link' ? (
                    <Check className="h-5 w-5 text-success flex-shrink-0 ml-2" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500 group-hover:text-brand flex-shrink-0 ml-2" />
                  )}
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* How to Earn Points - Mobile only */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:hidden"
          >
            <Card animate={false} className="border-white/5">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-brand" />
                  How to Earn Points
                </h3>
                <div className="space-y-3">
                  {[
                    { action: 'Refer a friend', points: '+50 pts', color: 'text-green-400' },
                    { action: 'First shield deposit', points: '+25 pts', color: 'text-brand' },
                    { action: 'Private send', points: '+10 pts', color: 'text-cyan-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-gray-400">{item.action}</span>
                      <span className={cn('text-sm font-semibold', item.color)}>{item.points}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mobile Disconnect Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:hidden"
          >
            <button
              onClick={handleDisconnect}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-xl',
                'bg-red-500/10 border border-red-500/20',
                'text-red-400 font-medium',
                'hover:bg-red-500/20 hover:border-red-500/30 transition-all'
              )}
            >
              <LogOut className="h-5 w-5" />
              Disconnect Wallet
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
