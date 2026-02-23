import { useState, type ReactNode } from 'react';
import { useApp } from './AppContext';
import { AVATARS, ICONS, getLevelInfo, LEVEL_TITLES, type AvatarKey } from './assets';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, LogOut, Flame, BookOpen, Star, Edit3, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from './i18n';
import type { ThemeMode, AppLanguage, AccentColor } from './AppContext';

export default function ProfileScreen() {
  const { user, updateUser, logout, setScreen, preferences, setTheme, setLanguage, setAccent } = useApp();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  if (!user) return null;

  const level = getLevelInfo(user.xp);
  const avatar = AVATARS[user.avatar];

  const handleAvatarChange = (key: AvatarKey) => {
    updateUser({ avatar: key });
    setShowAvatarPicker(false);
    toast.success('Avatar geändert! 🎭');
  };

  const handleNameSave = () => {
    if (nameInput.trim()) {
      updateUser({ name: nameInput.trim() });
      setEditingName(false);
      toast.success('Name geändert! ✏️');
    }
  };

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.55 0.25 285 / 0.12) 0%, transparent 50%)' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
        <button onClick={() => setScreen('home')} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display text-lg font-extrabold">{useT('profile')}</h1>
        {/* V1: Zahnrad führt zu Einstellungen (Dark/Light, Sprache, Theme) */}
        <button onClick={() => setShowSettings(!showSettings)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center" aria-label={useT('settings')}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="relative z-10 flex flex-col items-center mt-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAvatarPicker(true)}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-3"
            style={{
              borderColor: 'oklch(0.55 0.25 285 / 0.4)',
              boxShadow: '0 0 25px oklch(0.55 0.25 285 / 0.2)',
            }}>
            <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
            <Edit3 className="w-3 h-3 text-white" />
          </div>
        </motion.button>

        {editingName ? (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-1.5 text-center font-display font-bold text-sm outline-none focus:border-primary/40"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            />
            <button onClick={handleNameSave} className="text-primary text-xs font-bold">✓</button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="mt-3 font-display text-xl font-extrabold flex items-center gap-1.5">
            {user.name || 'Gast'}
            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}

        <p className="text-sm text-primary font-display font-bold mt-0.5">
          Lv. {level.level} – {level.title}
        </p>
        {user.isPrivate && (
          <span className="mt-2 px-2.5 py-1 rounded-xl text-xs font-display font-bold border border-primary/30 text-primary">
            Privat
          </span>
        )}
      </div>

      {/* Level Progress */}
      <div className="relative z-10 mx-5 mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Fortschritt</span>
          <span className="font-display font-bold text-primary">{level.pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-card border border-border overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, oklch(0.45 0.25 285), oklch(0.7 0.2 285))' }}
            initial={{ width: 0 }}
            animate={{ width: `${level.pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{user.xp} / {level.nextThresh} XP</p>
      </div>

      {/* Stats Grid */}
      <div className="relative z-10 grid grid-cols-3 gap-3 mx-5 mt-5">
        <StatCard icon={<img src={ICONS.xp} alt="XP" className="w-5 h-5" />} value={user.xp.toString()} label="Total XP" />
        <StatCard icon={<img src={ICONS.streak} alt="Streak" className="w-5 h-5" />} value={user.streak.toString()} label="Streak" />
        <StatCard icon={<BookOpen className="w-5 h-5 text-primary" />} value={user.sessions.toString()} label="Sessions" />
      </div>

      {/* V2: Gespeicherte Fakten Button */}
      <div className="relative z-10 mx-5 mt-5">
        <button
          onClick={() => setScreen('savedFacts')}
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-border bg-card active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-display font-bold text-sm">Gespeicherte Fakten</h3>
              <p className="text-xs text-muted-foreground">Deine Favoriten aus dem Feed</p>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
        </button>
      </div>

      {/* Level Roadmap */}
      <div className="relative z-10 mx-5 mt-5 mb-6">
        <h3 className="font-display font-bold text-sm mb-3">{useT('levelRoadmap')}</h3>
        <div className="space-y-2">
          {LEVEL_TITLES.slice(0, 6).map((title, i) => {
            const isUnlocked = level.level > i;
            const isCurrent = level.level === i + 1;
            return (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${isCurrent ? 'border border-primary/20 bg-primary/5' : isUnlocked ? 'opacity-50' : 'opacity-30'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-bold ${isCurrent ? 'bg-primary text-primary-foreground' : isUnlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-display font-bold">{title}</p>
                </div>
                {isUnlocked && <Star className="w-4 h-4 text-primary" fill="currentColor" />}
                {isCurrent && <Flame className="w-4 h-4 text-orange-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Einstellungen als Popup-Menü – kein Runterscrollen nötig */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettings(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-full max-w-[430px] max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-border bg-card p-5 pb-10 shadow-xl"
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h3 className="font-display font-bold text-lg mb-4">{useT('settings')}</h3>

              <div className="space-y-3">
                {/* Dark / Light Mode */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                  <span className="text-sm">{preferences.theme === 'dark' ? useT('settingsDarkMode') : useT('settingsLightMode')}</span>
                  <button
                    onClick={() => setTheme(preferences.theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-display font-bold"
                  >
                    {preferences.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {preferences.theme === 'dark' ? useT('settingsLightMode') : useT('settingsDarkMode')}
                  </button>
                </div>

                {/* Sprache */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{useT('settingsLanguage')}</p>
                  <div className="flex gap-2">
                    {(['de', 'en', 'es'] as AppLanguage[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 py-2 rounded-xl text-xs font-display font-bold border ${preferences.language === lang ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                          }`}
                      >
                        {lang === 'de' ? 'DE' : lang === 'en' ? 'EN' : 'ES'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Akzentfarbe */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{useT('settingsTheme')}</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['yellow', 'green', 'blue', 'purple', 'red'] as AccentColor[]).map((acc) => (
                      <button
                        key={acc}
                        onClick={() => setAccent(acc)}
                        className={`flex-1 min-w-[65px] py-2 rounded-xl text-xs font-display font-bold border ${preferences.accent === acc ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                          }`}
                      >
                        {acc === 'yellow' ? useT('themeYellow') : acc === 'green' ? useT('themeGreen') : acc === 'blue' ? useT('themeBlue') : acc === 'red' ? useT('themeRed') : useT('themePurple')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI URL */}
                <div className="p-3 rounded-xl border border-border bg-primary/5">
                  <p className="text-xs font-display font-bold text-primary mb-1">Cloud AI aktiv</p>
                  <p className="text-xs text-muted-foreground">Fynix nutzt eine kostenlose Cloud-KI (Pollinations.ai).</p>
                </div>

                {/* Roast Level */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{useT('roastLevel')}: {user.roastLevel}/5</p>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={user.roastLevel}
                    onChange={(e) => updateUser({ roastLevel: Number(e.target.value) })}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted"
                  />
                </div>

                <button
                  onClick={() => updateUser({ isPrivate: !user.isPrivate })}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background text-sm"
                >
                  <span>{useT('privacy')}</span>
                  <span className={`font-display font-bold ${user.isPrivate ? 'text-primary' : 'text-muted-foreground'}`}>
                    {user.isPrivate ? useT('private') : useT('public')}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowSettings(false);
                    logout();
                    toast.success('Abgemeldet! 👋');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  {useT('logout')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAvatarPicker(false)} />
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="relative w-full max-w-[430px] rounded-t-3xl border border-border bg-card p-5 pb-10"
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h3 className="font-display font-bold text-lg mb-4">Avatar wählen</h3>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(AVATARS) as [AvatarKey, typeof AVATARS[AvatarKey]][]).map(([key, av]) => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAvatarChange(key)}
                    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${user.avatar === key
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background'
                      }`}
                  >
                    <img src={av.src} alt={av.name} className="w-16 h-16 rounded-full object-cover" />
                    <span className="text-xs font-display font-bold mt-1.5">{av.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="p-3 rounded-2xl border border-border bg-card text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="font-display text-lg font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
