import { useApp } from './AppContext';
import { Home, Flame, Wallet, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useT } from './i18n';

const NAV_ITEMS = [
  { id: 'home', icon: Home, labelKey: 'home' },
  { id: 'habits', icon: Flame, labelKey: 'habits' },
  { id: 'feed', icon: null, labelKey: 'feed' },
  { id: 'money', icon: Wallet, labelKey: 'money' },
  { id: 'profile', icon: User, labelKey: 'profile' },
];

/** Dock – nutzt Theme (Dark/Light) und Akzentfarbe über CSS-Variablen (primary, card, border) */
export default function BottomNav() {
  const { screen, setScreen } = useApp();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 pt-2 pb-6">
        {NAV_ITEMS.map((item) => {
          if (item.id === 'feed') {
            return (
              <motion.button
                key="feed"
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('feed')}
                className="w-14 h-14 rounded-2xl flex items-center justify-center -mt-4 border-2 border-primary bg-primary text-primary-foreground shadow-lg"
              >
                <Zap className="w-6 h-6" fill="currentColor" />
              </motion.button>
            );
          }

          const Icon = item.icon!;
          const isActive = screen === item.id;

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setScreen(item.id)}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors"
            >
              <Icon
                className={`w-5 h-5 transition-all ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`}
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`}>
                {useT(item.labelKey)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
