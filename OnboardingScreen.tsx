import { useState } from 'react';
import { useApp } from './AppContext';
import { MASCOT, AVATARS, type AvatarKey } from './assets';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    id: 'school',
    question: 'Was ist gerade dein größtes Schulproblem?',
    mascotText: 'Yo! Lass mich dich kurz kennenlernen, damit ich dir richtig helfen kann! 🔥',
    options: ['Lernen fühlt sich sinnlos an', 'Ich lerne zu spät', 'Handy killt meinen Fokus', 'Prüfungen stressen', 'Eigentlich läuft\'s'],
    multi: false,
    field: 'schoolProblem',
  },
  {
    id: 'grade',
    question: 'Wo steckst du gerade?',
    mascotText: 'Damit ich weiß, wie schwer die Sachen sein dürfen! 📚',
    options: ['Unterstufe (5-7)', 'Mittelstufe (8-10)', 'Oberstufe (11-13)'],
    multi: false,
    field: 'grade',
  },
  {
    id: 'learnTime',
    question: 'Wann lernst du meistens?',
    mascotText: 'Keine Sorge, ich urteile nicht... okay, vielleicht ein bisschen 😏',
    options: ['Am Klo 🚽', 'Heimlich nachts 🌙', 'Kurz vor Tests 😰', 'Geplant 📅'],
    multi: false,
    field: 'learnTime',
  },
  {
    id: 'motivation',
    question: 'Warum bist du hier?',
    mascotText: 'Ehrliche Antwort = bessere Ergebnisse! 💪',
    options: ['Bessere Noten', 'Weniger Zeit verschwenden', 'Disziplin aufbauen', 'Geld checken', 'Alles davon'],
    multi: false,
    field: 'motivation',
  },
  {
    id: 'habits',
    question: 'Was nervt dich an dir selbst?',
    mascotText: 'Mehrfachauswahl erlaubt – sei ehrlich zu dir! 😤',
    options: ['Zu viel Handy', 'Zu viel Fastfood', 'Zu viel Zocken', 'Zu wenig Schlaf', 'Keine Struktur'],
    multi: true,
    field: 'habits',
  },
  {
    id: 'roast',
    question: 'Wie streng darf Fynix sein?',
    mascotText: 'Ich kann nett sein... oder gnadenlos. Deine Wahl! 😈',
    options: [],
    multi: false,
    field: 'roastLevel',
    isSlider: true,
  },
  {
    id: 'goal',
    question: 'Was wäre ein Win in 30 Tagen?',
    mascotText: 'Ein Ziel macht alles einfacher! 🎯',
    options: ['Bessere Note', 'Neue Routine', 'Weniger TikTok', 'Mehr Geld gespart'],
    multi: false,
    field: 'goal30',
  },
  {
    id: 'avatar',
    question: 'Wähl deinen Avatar!',
    mascotText: 'Wer willst du in Fynix sein? 🎭',
    options: [],
    multi: false,
    field: 'avatar',
    isAvatar: true,
  },
];

export default function OnboardingScreen() {
  const { updateUser, setScreen, user } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [roastLevel, setRoastLevel] = useState(3);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey>('gamer');

  const current = STEPS[step];
  const totalSteps = STEPS.length;

  const handleSelect = (option: string) => {
    if (current.multi) {
      setSelectedMulti(prev =>
        prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
      );
    } else {
      setAnswers(prev => ({ ...prev, [current.field]: option }));
      // Auto-advance after short delay
      setTimeout(() => advance({ [current.field]: option }), 300);
    }
  };

  const advance = (extraData?: Record<string, any>) => {
    const data = { ...answers, ...extraData };

    if (step === totalSteps - 1) {
      // Finish onboarding
      updateUser({
        ...data,
        avatar: selectedAvatar,
        roastLevel,
        habits: selectedMulti,
        onboarded: true,
        lastActive: new Date().toDateString(),
        streak: 1,
        xp: (user?.xp || 0) + 50,
      });
      setScreen('home');
      return;
    }

    if (current.multi) {
      setAnswers(prev => ({ ...prev, [current.field]: selectedMulti }));
    }

    setStep(s => s + 1);
    setSelectedMulti([]);
  };

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.55 0.25 285 / 0.12) 0%, transparent 60%)' }} />

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-12 pb-4 relative z-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${i <= step
              ? 'bg-gradient-to-r from-primary to-[oklch(0.7_0.22_330)]'
              : 'bg-border'
            }`}
            style={{ width: i === step ? '24px' : '8px' }}
          />
        ))}
      </div>

      {/* Progress text */}
      <div className="text-center text-xs text-muted-foreground mb-2 relative z-10">
        {step + 1} / {totalSteps}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col relative z-10"
        >
          {/* Mascot + bubble */}
          <div className="flex flex-col items-center px-6 pt-2 gap-3">
            <motion.img
              src={step === totalSteps - 1 ? MASCOT.happy : MASCOT.smug}
              alt="Fynix"
              className="w-28 h-28 object-contain animate-float"
              style={{ filter: 'drop-shadow(0 0 15px oklch(0.55 0.25 285 / 0.3))' }}
              animate={step === 0 ? { y: [0, -6, 0] } : { y: 0 }}
              transition={step === 0 ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
            />
            <div className="bg-card border border-primary/20 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[300px] text-sm leading-relaxed"
              style={{ boxShadow: '0 0 20px oklch(0.55 0.25 285 / 0.08)' }}>
              {current.mascotText}
            </div>
          </div>

          {/* Question */}
          <div className="px-6 mt-5">
            <h2 className="font-display text-xl font-extrabold leading-tight">
              {current.question}
            </h2>
          </div>

          {/* Options */}
          <div className="px-6 mt-4 flex-1">
            {current.isSlider ? (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-3">
                  <span>Nett 😊</span>
                  <span>Gnadenlos 😈</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={roastLevel}
                  onChange={(e) => setRoastLevel(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, oklch(0.7 0.18 145) 0%, oklch(0.55 0.25 285) 50%, oklch(0.6 0.22 25) 100%)`,
                  }}
                />
                <div className="text-center mt-4 font-display font-bold text-lg">
                  {roastLevel === 1 && 'Sanft wie ein Kätzchen 🐱'}
                  {roastLevel === 2 && 'Freundlich aber ehrlich 🤝'}
                  {roastLevel === 3 && 'Direkt und motivierend 💪'}
                  {roastLevel === 4 && 'Kein Mitleid 😤'}
                  {roastLevel === 5 && 'GNADENLOS 🔥💀'}
                </div>
                <button
                  onClick={() => advance({ roastLevel })}
                  className="mt-8 w-full py-4 rounded-2xl font-display font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
                    boxShadow: '0 0 20px oklch(0.55 0.25 285 / 0.3)',
                  }}
                >
                  Weiter
                </button>
              </div>
            ) : current.isAvatar ? (
              <div>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(Object.entries(AVATARS) as [AvatarKey, typeof AVATARS[AvatarKey]][]).map(([key, av]) => (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedAvatar(key)}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                        selectedAvatar === key
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card'
                      }`}
                      style={selectedAvatar === key ? { boxShadow: '0 0 16px oklch(0.55 0.25 285 / 0.25)' } : {}}
                    >
                      <img src={av.src} alt={av.name} className="w-16 h-16 rounded-full object-cover" />
                      <span className="text-xs font-display font-bold mt-1.5">{av.name}</span>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="font-display font-bold text-foreground">
                    Okay. Ich hab dich.
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Lass uns dein Leben ein kleines Stück weniger chaotisch machen.
                  </p>
                  <p className="text-primary font-display font-bold mt-2">Bonus: +50 XP</p>
                </div>
                <button
                  onClick={() => advance({ avatar: selectedAvatar })}
                  className="mt-6 w-full py-4 rounded-2xl font-display font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
                    boxShadow: '0 0 20px oklch(0.55 0.25 285 / 0.3)',
                  }}
                >
                  Ab ins Feed! 🚀
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {current.options.map((opt) => {
                  const isSelected = current.multi
                    ? selectedMulti.includes(opt)
                    : answers[current.field] === opt;
                  return (
                    <motion.button
                      key={opt}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/30'
                      }`}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
                {current.multi && selectedMulti.length > 0 && (
                  <button
                    onClick={() => advance()}
                    className="mt-4 w-full py-4 rounded-2xl font-display font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
                      boxShadow: '0 0 20px oklch(0.55 0.25 285 / 0.3)',
                    }}
                  >
                    Weiter ({selectedMulti.length} gewählt)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Skip */}
          {!current.isAvatar && (
            <button
              onClick={() => advance()}
              className="text-xs text-muted-foreground/50 text-center py-4"
            >
              Überspringen
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
