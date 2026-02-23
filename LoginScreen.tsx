import { useState } from 'react';
import { useApp } from './AppContext';
import { MASCOT } from './assets';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, UserX } from 'lucide-react';

export default function LoginScreen() {
  const { login, loginAsGuest, setScreen } = useApp();
  const [mode, setMode] = useState<'choose' | 'email'>('choose');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !name.trim()) {
      setError('Bitte füll alles aus 😤');
      return;
    }
    if (!email.includes('@')) {
      setError('Das sieht nicht nach einer E-Mail aus 🤔');
      return;
    }
    login(email.trim(), name.trim());
  };

  return (
    <div className="min-h-dvh flex flex-col px-6 pt-12 pb-10 relative">
      {/* Background glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.55 0.25 285 / 0.15) 0%, transparent 70%)' }} />

      {/* Logo */}
      <h1 className="font-display text-3xl font-extrabold text-center text-gradient">FYNIX</h1>
      <p className="text-center text-muted-foreground text-sm mt-1">Learn Different</p>

      {/* Mascot */}
      <motion.img
        src={MASCOT.happy}
        alt="Fynix"
        className="w-28 h-28 object-contain mx-auto mt-6 animate-float"
        style={{ filter: 'drop-shadow(0 0 20px oklch(0.55 0.25 285 / 0.35))' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      />

      {mode === 'choose' ? (
        <motion.div
          className="flex-1 flex flex-col mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display text-2xl font-extrabold">Hey! 👋</h2>
          <p className="text-muted-foreground text-sm mt-1 mb-8">Wie willst du starten?</p>

          <button
            onClick={() => setMode('email')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all mb-3"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))' }}>
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-sm">Mit E-Mail</div>
              <div className="text-xs text-muted-foreground">Fortschritt wird gespeichert</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <button
            onClick={loginAsGuest}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
              <UserX className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-sm">Ohne Account</div>
              <div className="text-xs text-muted-foreground">Direkt loslegen</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            Kein Spam. Keine Datenkrake. Versprochen.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="flex-1 flex flex-col mt-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button onClick={() => setMode('choose')} className="text-sm text-muted-foreground mb-4">
            ← Zurück
          </button>

          <h2 className="font-display text-xl font-extrabold mb-6">Account erstellen</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'oklch(0.6 0.22 25 / 0.1)', border: '1px solid oklch(0.6 0.22 25 / 0.3)', color: 'oklch(0.7 0.2 25)' }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Dein Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="z.B. Max"
                className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-foreground text-sm outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="deine@email.de"
                className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-foreground text-sm outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="mt-8 w-full py-4 rounded-2xl font-display font-bold text-base text-white"
            style={{
              background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
              boxShadow: '0 0 20px oklch(0.55 0.25 285 / 0.3)',
            }}
          >
            Weiter
          </button>
        </motion.div>
      )}
    </div>
  );
}
