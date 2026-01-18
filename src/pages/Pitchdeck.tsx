import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, Lock, Zap, TrendingUp, Eye, EyeOff,
  ArrowRight, CheckCircle2, Layers, Wallet,
  Target, Rocket, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/cn';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animated Shield Component
function AnimatedShield() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-brand/20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border-2 border-brand/30"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />
      
      {/* Center shield */}
      <motion.div
        className="absolute inset-8 bg-gradient-to-br from-brand/20 to-brand/5 rounded-3xl border border-brand/30 flex items-center justify-center backdrop-blur-sm"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Shield className="w-16 h-16 text-brand" />
      </motion.div>
      
      {/* Orbiting particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-brand rounded-full"
          style={{ top: '50%', left: '50%' }}
          animate={{
            x: [0, 80 * Math.cos((i * 2 * Math.PI) / 3), 0],
            y: [0, 80 * Math.sin((i * 2 * Math.PI) / 3), 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}

// Animated Flow Diagram - Responsive
function AnimatedFlow() {
  return (
    <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 py-8 px-4">
      {/* Wallet */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 flex items-center justify-center">
          <Wallet className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
        </div>
        <span className="text-xs text-gray-500">Your Wallet</span>
      </motion.div>

      {/* Arrow */}
      <motion.div
        className="flex items-center rotate-90 md:rotate-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-orange-500/50 to-brand/50"
          animate={{ scaleX: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <ArrowRight className="w-4 h-4 text-brand" />
      </motion.div>

      {/* Privacy Pool */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-brand/30 to-cyan-500/10 border-2 border-brand/40 flex items-center justify-center"
          animate={{ boxShadow: ['0 0 20px rgba(45,91,255,0.2)', '0 0 40px rgba(45,91,255,0.4)', '0 0 20px rgba(45,91,255,0.2)'] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Lock className="w-6 h-6 md:w-8 md:h-8 text-brand" />
        </motion.div>
        <span className="text-xs text-gray-500">ZK Privacy Pool</span>
      </motion.div>

      {/* Arrow */}
      <motion.div
        className="flex items-center rotate-90 md:rotate-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-brand/50 to-green-500/50"
          animate={{ scaleX: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <ArrowRight className="w-4 h-4 text-green-400" />
      </motion.div>

      {/* Anonymous Output */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 flex items-center justify-center">
          <EyeOff className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
        </div>
        <span className="text-xs text-gray-500">Anonymous</span>
      </motion.div>
    </div>
  );
}

// Stats Counter
function StatCounter({ value, label, prefix = '', suffix = '' }: { value: string; label: string; prefix?: string; suffix?: string }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
    >
      <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
        {prefix}<span className="text-brand">{value}</span>{suffix}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </motion.div>
  );
}

export default function Pitchdeck() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Loopy" className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="text-base sm:text-lg font-semibold text-white">Loopy</span>
          </div>

          <a
            href="https://x.com/loopy_cash"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm hidden sm:inline">@loopy_cash</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 pt-16 pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand/[0.08] rounded-full blur-[150px]" />
        </div>

        <motion.div
          className="relative max-w-5xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-sm text-brand">
              <Rocket className="w-4 h-4" />
              Investor Pitch Deck
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            The Privacy Layer for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-blue-400 to-cyan-400">
              Solana
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto mb-12"
          >
            Loopy enables private, untraceable transactions on the fastest blockchain. 
            Shield your balance. Send anonymously. Break the chain.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <AnimatedShield />
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="px-6 lg:px-8 py-20 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand text-sm font-semibold uppercase tracking-wider">The Problem</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4 mb-6">
              Solana is <span className="text-red-400">Completely Transparent</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every transaction, every balance, every interaction — visible to the entire world.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Eye,
                title: 'Balance Exposure',
                description: 'Anyone can see exactly how much SOL you hold',
                color: 'text-red-400',
                bg: 'from-red-500/10 to-red-500/5',
                border: 'border-red-500/20'
              },
              {
                icon: TrendingUp,
                title: 'Transaction Tracking',
                description: 'Every buy, sell, and transfer is permanently recorded',
                color: 'text-orange-400',
                bg: 'from-orange-500/10 to-orange-500/5',
                border: 'border-orange-500/20'
              },
              {
                icon: Target,
                title: 'Targeted Attacks',
                description: 'Whales become targets for hackers and scammers',
                color: 'text-yellow-400',
                bg: 'from-yellow-500/10 to-yellow-500/5',
                border: 'border-yellow-500/20'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                className={cn(
                  'p-6 rounded-2xl border backdrop-blur-sm',
                  `bg-gradient-to-br ${item.bg} ${item.border}`
                )}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <item.icon className={cn('w-10 h-10 mb-4', item.color)} />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand text-sm font-semibold uppercase tracking-wider">The Solution</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4 mb-6">
              <span className="text-brand">Loopy</span> — Privacy Made Simple
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Zero-knowledge proofs enable private transactions without compromising security.
            </p>
          </motion.div>

          <AnimatedFlow />

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: Shield,
                title: 'ZK Shielding',
                description: 'Deposit SOL into a privacy pool protected by zero-knowledge proofs',
                status: 'Live',
                statusColor: 'bg-green-500'
              },
              {
                icon: EyeOff,
                title: 'Anonymous Sends',
                description: 'Transfer to any wallet without revealing your identity',
                status: 'Live',
                statusColor: 'bg-green-500'
              },
              {
                icon: Layers,
                title: 'Private Swaps',
                description: 'Trade tokens without exposing your trading strategy',
                status: 'Coming Soon',
                statusColor: 'bg-brand'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute top-4 right-4">
                  <span className={cn('px-2 py-1 text-xs rounded-full text-white', item.statusColor)}>
                    {item.status}
                  </span>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                  <item.icon className="w-7 h-7 text-brand" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 lg:px-8 py-20 bg-gradient-to-b from-transparent to-brand/[0.03]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand text-sm font-semibold uppercase tracking-wider">How It Works</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4">
              Three Simple Steps
            </h2>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Shield Your SOL',
                description: 'Deposit SOL into the Loopy privacy pool. Your funds are encrypted using zero-knowledge proofs — only you can access them.',
                icon: Shield
              },
              {
                step: '02',
                title: 'Break the Link',
                description: 'Once shielded, there\'s no visible connection between your deposit and any future withdrawal. The on-chain trail goes cold.',
                icon: Lock
              },
              {
                step: '03',
                title: 'Withdraw Anonymously',
                description: 'Send to any wallet address. The recipient receives clean funds with no trace back to your original wallet.',
                icon: EyeOff
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex gap-6 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-brand">{item.step}</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                    {item.title}
                    <item.icon className="w-5 h-5 text-brand" />
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand text-sm font-semibold uppercase tracking-wider">Technology</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4 mb-6">
              Built on Proven Cryptography
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              className="p-8 rounded-3xl bg-gradient-to-br from-brand/10 to-transparent border border-brand/20"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4">Zero-Knowledge Proofs</h3>
              <p className="text-gray-400 mb-6">
                Groth16 ZK-SNARKs enable cryptographic verification of transactions without revealing any details. 
                Prove you own funds without showing your balance.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Groth16', 'ZK-SNARKs', 'Client-side Proofs'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-brand/10 text-brand text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4">Non-Custodial Design</h3>
              <p className="text-gray-400 mb-6">
                Your keys, your coins. Loopy never has access to your funds. 
                All transactions require your wallet signature — we're just the privacy layer.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Self-Custody', 'Wallet Signing', 'Trustless'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            className="mt-8 p-4 md:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <span className="text-gray-500 text-sm">Powered by</span>
              <div className="flex items-center gap-4 md:gap-8">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                  <span className="text-sm md:text-lg font-semibold">ShadowPay</span>
                </div>
                <span className="text-gray-600 hidden md:inline">|</span>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                  <span className="text-sm md:text-lg font-semibold">Solana</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="px-6 lg:px-8 py-20 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand text-sm font-semibold uppercase tracking-wider">Market Opportunity</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4 mb-6">
              Privacy is a <span className="text-brand">Growing Need</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <StatCounter value="$12B+" label="Solana DeFi TVL" />
            <StatCounter value="50M+" label="Monthly Active Wallets" />
            <StatCounter value="Few" label="Privacy Solutions" />
          </div>

          <motion.div
            className="p-8 rounded-3xl bg-gradient-to-r from-brand/10 via-transparent to-brand/10 border border-brand/20 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-2xl lg:text-3xl font-medium text-gray-300">
              Solana has <span className="text-white font-bold">very few privacy tools</span>. 
              Every whale, every trader, every user is fully exposed.{' '}
              <span className="text-brand">Loopy changes that.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand text-sm font-semibold uppercase tracking-wider">Roadmap</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4">
              What's Next
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { phase: 'Live', title: 'SOL Shielding', items: ['ZK privacy pool', 'Anonymous sends', 'Referral system'], done: true },
              { phase: 'Coming Soon', title: 'Token Support', items: ['USDC shielding', 'SPL token support', 'Multi-token pools'], done: false },
              { phase: 'Coming Soon', title: 'Private Swaps', items: ['DEX integration', 'Anonymous trading', 'Limit orders'], done: false },
              { phase: 'Coming Soon', title: '$LOOPY Token', items: ['Governance token', 'Staking rewards', 'Fee sharing'], done: false },
            ].map((item, i) => (
              <motion.div
                key={i}
                className={cn(
                  'p-6 rounded-2xl border flex flex-col md:flex-row md:items-center gap-4',
                  item.done 
                    ? 'bg-brand/10 border-brand/30' 
                    : 'bg-white/[0.02] border-white/[0.06]'
                )}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex-shrink-0 w-24">
                  <span className={cn(
                    'text-sm font-semibold',
                    item.done ? 'text-brand' : 'text-gray-500'
                  )}>
                    {item.phase}
                  </span>
                </div>
                <div className="flex-shrink-0 w-40">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    {item.title}
                    {item.done && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.items.map((tag) => (
                    <span key={tag} className={cn(
                      'px-3 py-1 rounded-full text-sm',
                      item.done 
                        ? 'bg-brand/20 text-brand' 
                        : 'bg-white/[0.05] text-gray-400'
                    )}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-8 py-32">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            Privacy is a <span className="text-brand">Right</span>,<br />
            Not a Feature
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join the growing community of Solana users who value their financial privacy.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-brand text-white font-medium text-lg hover:bg-brand/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Launch App
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Loopy" className="h-6 w-6" />
            <span className="text-sm text-gray-500">© 2026 Loopy. All rights reserved.</span>
          </div>
          <a
            href="https://x.com/loopy_cash"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm">@loopy_cash</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
