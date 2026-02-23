import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApp } from './AppContext';
import { MASCOT, ICONS, AVATARS, getLevelInfo, getStreakBonus } from './assets';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Gift, Trophy, Target, ChevronRight, BookOpen, Pencil, Trash2, ImagePlus, FileText, FileDown, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getVocabFeedback } from './lib/vocabFeedback';
import { useT } from './i18n';
import { ollamaChat, OLLAMA_TEXT_MODEL, OLLAMA_VISION_MODEL } from './lib/ollama';
import { getImageComment, extractTextFromImage } from './lib/imageAnalysis';

type QuizMode = 'mc' | 'input';
type QuizDirection = 'source-target' | 'target-source' | 'mixed';
type QuizItem = { question: string; answer: string; options?: string[] };

export default function HomeScreen() {
  const {
    user,
    setScreen,
    getMascotMood,
    getRoast,
    jokers,
    chests,
    openChest,
    buyJoker,
    vocabLists,
    addVocabList,
    addVocabEntries,
    addVocabEntry,
    removeVocabEntry,
    updateVocabEntry,
  } = useApp();
  const [showChest, setShowChest] = useState(false);
  const [showJokerShop, setShowJokerShop] = useState(false);

  if (!user) return null;

  const level = getLevelInfo(user.xp);
  const mood = getMascotMood();
  const bonus = getStreakBonus(user.streak);
  const avatar = AVATARS[user.avatar];
  const greeting = getGreeting();
  const languages = ['Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Italienisch', 'Latein', 'Türkisch', 'Arabisch', 'Russisch', 'Polnisch', 'Niederländisch'];
  const totalVocab = vocabLists.reduce((sum, list) => sum + list.entries.length, 0);


  function getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return 'Nachtschicht? 🌙';
    if (h < 12) return 'Guten Morgen! ☀️';
    if (h < 17) return 'Hey! 👋';
    if (h < 21) return 'Guten Abend! 🌅';
    return 'Noch wach? 🌙';
  }

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.55 0.25 285 / 0.1) 0%, transparent 50%)' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen('profile')}
            className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/30"
            style={{ boxShadow: '0 0 12px oklch(0.55 0.25 285 / 0.2)' }}
          >
            <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" />
          </motion.button>
          <div>
            <p className="text-xs text-muted-foreground">{greeting}</p>
            <p className="font-display font-bold text-sm">{user.name || 'Gast'}</p>
          </div>
        </div>

        {/* Streak + XP badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-card border border-border">
            <img src={ICONS.streak} alt="Streak" className="w-5 h-5" />
            <span className="font-display font-bold text-xs">{user.streak}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-card border border-border">
            <img src={ICONS.xp} alt="XP" className="w-5 h-5" />
            <span className="font-display font-bold text-xs">{user.xp}</span>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="relative z-10 px-5 mt-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-display font-bold text-primary">Lv. {level.level} – {level.title}</span>
          <span className="text-muted-foreground">{user.xp} / {level.nextThresh} XP</span>
        </div>
        <div className="h-2.5 rounded-full bg-card border border-border overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, oklch(0.45 0.25 285), oklch(0.7 0.2 285))' }}
            initial={{ width: 0 }}
            animate={{ width: `${level.pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        {bonus > 0 && (
          <p className="text-xs text-primary/70 mt-1">🔥 Streak-Bonus: +{bonus}% XP</p>
        )}
      </div>

      {/* Mascot Card */}
      <div className="relative z-10 mx-5 mt-5">
        <motion.div
          className="rounded-3xl p-5 border border-primary/15 overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, oklch(0.18 0.03 285), oklch(0.22 0.04 285))',
            boxShadow: '0 0 30px oklch(0.55 0.25 285 / 0.1)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, oklch(0.55 0.25 285 / 0.15) 0%, transparent 70%)' }} />

          <div className="flex items-center gap-4">
            <img
              src={MASCOT[mood]}
              alt="Fynix"
              className="w-24 h-24 object-contain"
              style={{ filter: 'drop-shadow(0 0 12px oklch(0.55 0.25 285 / 0.3))' }}
            />
            <div className="flex-1">
              <p className="font-display font-bold text-sm text-foreground/90">
                {getMascotMessage(mood, user.streak)}
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setScreen('feed')}
                className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-bold text-xs text-white"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
                  boxShadow: '0 0 14px oklch(0.55 0.25 285 / 0.3)',
                }}
              >
                <Zap className="w-4 h-4" fill="white" />
                Feed starten
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <div className="relative z-10 px-5 mt-5 grid grid-cols-2 gap-3">
        <QuickCard
          icon={<Target className="w-5 h-5" />}
          label="Habits"
          sublabel={`${user.habits?.length || 0} aktiv`}
          color="oklch(0.55 0.2 170)"
          onClick={() => setScreen('habits')}
        />
        <QuickCard
          icon={<Trophy className="w-5 h-5" />}
          label="Profil"
          sublabel={`Lv. ${level.level}`}
          color="oklch(0.65 0.22 80)"
          onClick={() => setScreen('profile')}
        />
        <QuickCard
          icon={<Gift className="w-5 h-5" />}
          label="Truhen"
          sublabel={`${chests} verfügbar`}
          color="oklch(0.6 0.22 330)"
          onClick={() => setShowChest(true)}
        />
        <QuickCard
          icon={<Zap className="w-5 h-5" />}
          label="Joker"
          sublabel={`${jokers} übrig`}
          color="oklch(0.6 0.22 50)"
          onClick={() => setShowJokerShop(true)}
        />
      </div>

      {/* Lernen mit FYNIX: Quiz aus Material, Lernzettel PDF, FYNIX-Chat */}
      <div className="relative z-10 px-5 mt-5">
        <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Lernen mit FYNIX</p>
        <div className="grid grid-cols-1 gap-3">
          <QuickCard
            icon={<ImagePlus className="w-5 h-5" />}
            label="Quiz aus Lehrstoff"
            sublabel="Bild oder Text → Quiz"
            color="oklch(0.55 0.25 285)"
            onClick={() => setScreen('quiz-material')}
          />
          <QuickCard
            icon={<FileDown className="w-5 h-5" />}
            label="Lernzettel als PDF"
            sublabel="Thema → PDF erstellen"
            color="oklch(0.6 0.2 145)"
            onClick={() => setScreen('lernzettel')}
          />
          <QuickCard
            icon={<MessageCircle className="w-5 h-5" />}
            label="FYNIX Chat"
            sublabel="Fragen stellen · Mit FYNIX reden"
            color="oklch(0.6 0.22 330)"
            onClick={() => setScreen('fynix-chat')}
          />
        </div>
      </div>

      {/* Daily Tip */}
      <motion.div
        className="relative z-10 mx-5 mt-5 mb-6 p-4 rounded-2xl border border-border bg-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tipp des Tages</p>
            <p className="text-sm font-medium mt-1 text-foreground/90">
              Lerne in 25-Minuten-Blöcken. Dein Gehirn dankt es dir! 🧠
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 mx-5 mb-8 p-4 rounded-2xl border border-border bg-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Vokabeln</p>
            <p className="text-sm font-medium mt-1 text-foreground/90">
              {vocabLists.length} Listen • {totalVocab} Vokabeln
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setScreen('vocab')}
            className="px-4 py-2 rounded-xl text-xs font-display font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
              boxShadow: '0 0 14px oklch(0.55 0.25 285 / 0.3)',
            }}
          >
            Öffnen
          </motion.button>
        </div>
      </motion.div>



      <AnimatePresence>
        {showChest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowChest(false)} />
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="relative w-full max-w-[430px] rounded-t-3xl border border-border bg-card p-5 pb-10"
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h3 className="font-display font-bold text-lg">Truhen öffnen</h3>
              <p className="text-sm text-muted-foreground mt-1">Du hast {chests} Truhe{chests === 1 ? '' : 'n'}.</p>
              <button
                onClick={() => {
                  if (chests <= 0) {
                    toast.error('Keine Truhen übrig 😴');
                    return;
                  }
                  const reward = openChest();
                  toast.success(reward);
                  setShowChest(false);
                }}
                className="mt-6 w-full py-4 rounded-2xl font-display font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
                  boxShadow: '0 0 20px oklch(0.55 0.25 285 / 0.3)',
                }}
              >
                Truhe öffnen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJokerShop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowJokerShop(false)} />
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="relative w-full max-w-[430px] rounded-t-3xl border border-border bg-card p-5 pb-10"
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h3 className="font-display font-bold text-lg">Joker-Shop</h3>
              <p className="text-sm text-muted-foreground mt-1">Tausche XP gegen Joker für Quiz-Tricks.</p>
              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deine XP</span>
                  <span className="font-display font-bold">{user.xp}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Preis pro Joker</span>
                  <span className="font-display font-bold">50 XP</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const ok = buyJoker(50);
                  if (ok) {
                    toast.success('Joker gekauft! 🃏');
                    setShowJokerShop(false);
                  } else {
                    toast.error('Zu wenig XP 😬');
                  }
                }}
                className="mt-6 w-full py-4 rounded-2xl font-display font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
                  boxShadow: '0 0 20px oklch(0.55 0.25 285 / 0.3)',
                }}
              >
                Joker kaufen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickCard({ icon, label, sublabel, color, onClick }: {
  icon: ReactNode;
  label: string;
  sublabel: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="p-4 rounded-2xl border border-border bg-card text-left"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color} / 0.15`, color }}>
        {icon}
      </div>
      <p className="font-display font-bold text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
    </motion.button>
  );
}

function getMascotMessage(mood: string, streak: number): string {
  if (mood === 'throne') return 'Boss-Mode aktiviert. Du regierst den Feed 👑';
  if (mood === 'laughing') return `${streak} Tage Streak! Du bist on fire! 🔥`;
  if (mood === 'happy') return 'Nice! Heute läuft’s richtig gut ✨';
  if (mood === 'thinking') return 'Focus an. Neues Wissen, neues Level 🧠';
  if (mood === 'sleepy') return 'Zeit aufzuwachen. Ein Swipe und du bist drin 😴';
  if (mood === 'crying') return 'Dein Streak ist weg... Komm schon, fang neu an! 😤';
  if (mood === 'smug') return 'Bereit für heute? Lass uns was lernen! 💪';
  return 'Hey! Scroll dich schlau! 📚';
}
