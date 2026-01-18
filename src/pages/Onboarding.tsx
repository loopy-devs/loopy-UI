import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Sparkles, Shield, ArrowRight,
  Lock, EyeOff, Unlink, Zap, CheckCircle2, Menu, X
} from 'lucide-react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function Onboarding() {
  const navigate = useNavigate();
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();
  const { isRegistered, isLoading, error, referralCode, register } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isConnected && isRegistered) {
      navigate('/dashboard', { replace: true });
    }
  }, [isConnected, isRegistered, navigate]);

  useEffect(() => {
    if (isConnected && !isRegistered && !isLoading) {
      register();
    }
  }, [isConnected, isRegistered, isLoading]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-brand/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-600/[0.05] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Loopy" className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="text-base sm:text-lg font-semibold text-white">Loopy</span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              How it Works
            </button>
            <Link to="/pitchdeck" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pitchdeck
            </Link>
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {!isConnected && (
              <button
                onClick={() => open()}
                className="flex items-center gap-1.5 h-8 sm:h-9 px-3 sm:px-4 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
              >
                <span className="hidden sm:inline">Launch App</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}

            {/* Hamburger Menu Button - Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>

      </header>

      {/* Mobile Menu Overlay - Fixed position over content */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 top-14 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden fixed top-14 left-0 right-0 z-50 bg-[#0a0a0f] border-b border-white/[0.06]"
            >
              <nav className="flex flex-col py-4 px-6 space-y-1">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Sparkles className="h-4 w-4 text-brand" />
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Zap className="h-4 w-4 text-cyan-400" />
                  How it Works
                </button>
                <Link 
                  to="/pitchdeck"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ArrowRight className="h-4 w-4 text-green-400" />
                  Pitchdeck
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        {/* Hero */}
        <section className="px-6 lg:px-8 pt-20 lg:pt-32 pb-16 lg:pb-24">
          <div className="max-w-7xl mx-auto">
            {/* Referral badge */}
            {referralCode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mb-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>+50 bonus points with referral</span>
                </div>
              </motion.div>
            )}

            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                  Private transactions
                  <br />
                  <span className="text-brand">on Solana.</span>
                </h1>
                
                <p className="text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                  Shield your SOL, break on-chain links, and send anonymously. 
                  Zero-knowledge privacy that just works.
                </p>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                {!isConnected ? (
                  <>
                    <button
                      onClick={() => open()}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-brand text-white font-medium hover:bg-brand/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Connect Wallet
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-gray-400 font-medium hover:text-white transition-colors"
                    >
                      Learn more
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                ) : isLoading ? (
                  <Button size="lg" isLoading disabled className="h-12 px-8 rounded-xl">
                    Verifying...
                  </Button>
                ) : error ? (
                  <div className="w-full max-w-sm space-y-3">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
                      {error}
                    </div>
                    <Button onClick={register} className="w-full h-12 rounded-xl">
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={register}
                    className="flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-brand text-white font-medium hover:bg-brand/90 transition-all"
                  >
                    Sign & Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-xs text-gray-600"
              >
                By connecting, you agree to our Terms of Service
              </motion.p>
            </div>
          </div>
        </section>

        {/* Bento Features Grid */}
        <section id="features" className="px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {/* Large card - Shield */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 lg:row-span-2 group"
              >
                <div className="h-full p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                  <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center mb-6">
                    <Shield className="h-6 w-6 text-brand" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-semibold text-white mb-3">
                    ZK Shielding
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
                    Deposit SOL or USDC into a zero-knowledge privacy pool. Your balance 
                    becomes invisible to blockchain explorers and on-chain analytics.
                  </p>
                  
                  {/* Visual element */}
                  <div className="relative h-48 lg:h-64 rounded-xl bg-gradient-to-br from-brand/5 to-transparent border border-white/[0.04] overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-2xl bg-brand/20 flex items-center justify-center">
                          <Shield className="h-10 w-10 text-brand" />
                        </div>
                        {/* Animated rings */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-brand/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute -inset-4 rounded-3xl border border-brand/10 animate-ping" style={{ animationDuration: '3s' }} />
                      </div>
                    </div>
                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-30" style={{
                      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(45,91,255,0.15) 1px, transparent 0)',
                      backgroundSize: '24px 24px'
                    }} />
                  </div>
                </div>
              </motion.div>

              {/* Card - Break Chain */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="h-full p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-5">
                    <Unlink className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Break the Chain
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Your deposit and withdrawal have no visible link on-chain. 
                    The connection is broken — no one can trace it back to you.
                  </p>
                </div>
              </motion.div>

              {/* Card - Hidden Sends */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="h-full p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-5">
                    <EyeOff className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Anonymous Sends
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Send to any wallet without revealing your identity. 
                    Recipients receive funds, not your address.
                  </p>
                </div>
              </motion.div>

              {/* Wide card - Speed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-3"
              >
                <div className="p-6 lg:p-8 rounded-2xl bg-gradient-to-r from-brand/[0.08] via-white/[0.02] to-cyan-500/[0.08] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-12">
                    {/* Icon and text - stack on mobile */}
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-brand/10 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg lg:text-xl font-semibold text-white">Instant & Non-Custodial</h3>
                        <p className="text-sm lg:text-base text-gray-400">Transactions settle in seconds. You always control your keys.</p>
                      </div>
                    </div>
                    
                    {/* Processing time - centered on mobile */}
                    <div className="flex justify-center lg:justify-end lg:flex-1">
                      <div className="text-center px-8 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-2xl font-bold text-white">~30s</div>
                        <div className="text-sm text-gray-500">Processing time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="px-6 lg:px-8 py-16 lg:py-24 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 uppercase tracking-wider mb-4">
                How it works
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Three steps to privacy
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: '01',
                  title: 'Shield',
                  description: 'Deposit SOL or tokens into the privacy pool. ZK proofs mask your balance.',
                },
                {
                  step: '02',
                  title: 'Wait',
                  description: 'Let funds mix with other users. The longer you wait, the more private.',
                },
                {
                  step: '03',
                  title: 'Withdraw',
                  description: 'Send to any address. No link to your original deposit.',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent -translate-x-1/2" />
                  )}
                  
                  <div className="text-5xl font-bold text-white/[0.06] mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Privacy */}
        <section className="px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 uppercase tracking-wider mb-4">
                  Why privacy matters
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                  Your balance is public.
                  <br />
                  <span className="text-gray-500">That's a problem.</span>
                </h2>
                <p className="text-lg text-gray-400 mb-8">
                  On Solana, anyone can see your wallet balance, transaction history, 
                  and who you transact with. This makes you a target for hackers, 
                  scammers, and surveillance.
                </p>
                
                <div className="space-y-4">
                  {[
                    'Hackers target wallets with large balances',
                    'Your financial history is permanently public',
                    'Transaction patterns reveal your identity',
                    'No separation between personal and business',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Privacy visualization */}
                <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] p-8 lg:p-12">
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 rounded-2xl bg-brand/10 flex items-center justify-center mb-6">
                      <Lock className="h-10 w-10 text-brand" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">Loopy</div>
                    <div className="text-gray-500 mb-6">Your privacy toolkit</div>
                    
                    <div className="w-full space-y-3">
                      <div className="h-3 rounded-full bg-white/[0.03] overflow-hidden">
                        <div className="h-full w-3/4 rounded-full bg-brand/30" />
                      </div>
                      <div className="h-3 rounded-full bg-white/[0.03] overflow-hidden">
                        <div className="h-full w-1/2 rounded-full bg-brand/20" />
                      </div>
                      <div className="h-3 rounded-full bg-white/[0.03] overflow-hidden">
                        <div className="h-full w-5/6 rounded-full bg-brand/40" />
                      </div>
                    </div>
                    
                    <div className="mt-6 text-sm text-gray-500">
                      Balance: <span className="text-brand font-mono">████████</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
                Ready for privacy?
              </h2>
              <p className="text-lg text-gray-400 mb-10">
                Join the growing number of users who protect their financial privacy on Solana.
              </p>

              {!isConnected && (
                <button
                  onClick={() => open()}
                  className="inline-flex items-center justify-center gap-2 h-14 px-10 rounded-xl bg-brand text-white font-medium text-lg hover:bg-brand/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Loopy" className="h-6 w-6" />
            <span className="text-sm text-gray-500">© 2026 Loopy</span>
          </div>
          
          {/* X (Twitter) Link */}
          <a
            href="https://x.com/loopy_cash"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm font-medium">@loopy_cash</span>
          </a>
          
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Lock className="h-3.5 w-3.5" />
            <span>Powered by ShadowPay Protocol</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
