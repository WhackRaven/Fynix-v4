import { useApp } from './AppContext';
import { MASCOT } from './assets';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  const { setScreen } = useApp();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, oklch(0.55 0.25 285 / 0.12) 0%, transparent 60%)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, oklch(0.5 0.2 200 / 0.08) 0%, transparent 60%)' }} />
      </div>

      {/* Mascot */}
      <motion.img
        src={MASCOT.smug}
        alt="Fynix"
        className="w-40 h-40 object-contain drop-shadow-[0_0_30px_oklch(0.55_0.25_285_/_0.4)]"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        style={{ filter: 'drop-shadow(0 0 20px oklch(0.55 0.25 285 / 0.4))' }}
      />

      {/* Logo */}
      <motion.h1
        className="font-display text-4xl font-extrabold mt-6 text-gradient"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        FYNIX
      </motion.h1>

      {/* Tagline */}
      <motion.div
        className="text-center mt-4 space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-lg font-display font-semibold text-foreground/90">
          Scroll smarter.
        </p>
        <p className="text-sm text-muted-foreground">
          Lernen. Gewohnheiten. Kontrolle.
        </p>
      </motion.div>

      {/* CTA Button */}
      <motion.button
        onClick={() => setScreen('login')}
        className="mt-10 w-full max-w-[280px] py-4 rounded-2xl font-display font-bold text-base text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
          boxShadow: '0 0 30px oklch(0.55 0.25 285 / 0.35)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.96 }}
      >
        Los geht's
      </motion.button>

      {/* Version */}
      <motion.p
        className="mt-6 text-xs text-muted-foreground/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        v2.0 – Learn Different
      </motion.p>
    </div>
  );
}
