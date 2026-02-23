import { useState } from 'react';
import { useApp, type Habit } from './AppContext';
import { MASCOT } from './assets';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Flame, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_HABITS = {
  positive: [
    { name: '30 Min lesen 📚', xpValue: 20 },
    { name: 'Sport / Bewegung 💪', xpValue: 25 },
    { name: 'Gesund essen 🥗', xpValue: 15 },
    { name: '8h Schlaf 😴', xpValue: 20 },
    { name: 'Lernen 📝', xpValue: 30 },
    { name: 'Kein Handy 1h 📵', xpValue: 15 },
  ],
  negative: [
    { name: 'Fastfood gegessen 🍔', xpValue: -15 },
    { name: '3h+ Handy 📱', xpValue: -20 },
    { name: 'Nicht gelernt 😬', xpValue: -25 },
    { name: 'Zu spät ins Bett 🌙', xpValue: -10 },
    { name: 'Prokrastiniert 😴', xpValue: -15 },
  ],
};

export default function HabitScreen() {
  const { habits, addHabit, completeHabit, removeHabit, addXP, removeXP, setScreen, getRoast } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'positive' | 'negative'>('positive');
  const [customName, setCustomName] = useState('');
  const [addReps, setAddReps] = useState(1);

  const todayHabits = habits;
  const completedCount = todayHabits.filter(h => h.completedToday).length;

  const handleComplete = (habit: Habit) => {
    if (habit.completedToday) return;
    completeHabit(habit.id);
    const multiplier = Math.max(1, habit.reps || 1);
    const totalXP = habit.xpValue * multiplier;
    if (totalXP > 0) {
      addXP(totalXP);
      toast.success(`+${totalXP} XP! 🎉`, { description: habit.name });
    } else {
      removeXP(Math.abs(totalXP));
      toast.error(getRoast(), { description: `${totalXP} XP 💀` });
    }
  };

  const handleAddPreset = (preset: { name: string; xpValue: number }) => {
    addHabit({
      name: preset.name,
      type: preset.xpValue > 0 ? 'positive' : 'negative',
      xpValue: preset.xpValue,
      reps: addReps,
    });
    setAddReps(1);
    toast.success('Habit hinzugefügt! ✅');
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    addHabit({
      name: customName,
      type: addType,
      xpValue: addType === 'positive' ? 15 : -15,
      reps: addReps,
    });
    setCustomName('');
    setAddReps(1);
    toast.success('Custom Habit erstellt! ✅');
  };

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.55 0.2 170 / 0.08) 0%, transparent 50%)' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
        <button onClick={() => setScreen('home')} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display text-lg font-extrabold">Habits</h1>
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-card border border-border">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="font-display font-bold text-xs">{completedCount}/{todayHabits.length}</span>
        </div>
      </div>

      {/* Progress */}
      {todayHabits.length > 0 && (
        <div className="relative z-10 px-5 mt-2">
          <div className="h-2 rounded-full bg-card border border-border overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, oklch(0.55 0.2 170), oklch(0.7 0.18 145))' }}
              animate={{ width: `${todayHabits.length > 0 ? (completedCount / todayHabits.length) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Habit List */}
      <div className="relative z-10 px-5 mt-4 space-y-2.5 pb-4">
        {todayHabits.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <img src={MASCOT.sleepy} alt="Fynix" className="w-24 h-24 object-contain opacity-60" />
            <p className="font-display font-bold text-sm mt-4">Noch keine Habits!</p>
            <p className="text-xs text-muted-foreground mt-1">Füg welche hinzu und bau dir eine Routine auf.</p>
          </div>
        ) : (
          <AnimatePresence>
            {todayHabits.map((habit) => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  habit.completedToday
                    ? 'border-primary/20 bg-primary/5 opacity-60'
                    : 'border-border bg-card'
                }`}
              >
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleComplete(habit)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    habit.completedToday
                      ? 'bg-primary/20'
                      : habit.type === 'positive'
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  {habit.completedToday ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : habit.type === 'positive' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </motion.button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${habit.completedToday ? 'line-through' : ''}`}>
                    {habit.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-display font-bold ${habit.xpValue > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {habit.xpValue > 0 ? '+' : ''}{habit.xpValue} XP
                    </span>
                    {habit.streak > 0 && (
                      <span className="text-xs text-muted-foreground">🔥 {habit.streak}d</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removeHabit(habit.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add Button */}
      <div className="relative z-10 px-5 mt-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(!showAdd)}
          className="w-full py-3.5 rounded-2xl border border-dashed border-primary/30 flex items-center justify-center gap-2 text-sm font-display font-bold text-primary/70 hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Habit hinzufügen
        </motion.button>
      </div>

      {/* Add Panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="relative z-20 mx-5 mt-3 p-4 rounded-2xl border border-border bg-card mb-6"
          >
            {/* Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAddType('positive')}
                className={`flex-1 py-2 rounded-xl text-xs font-display font-bold transition-all ${
                  addType === 'positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-muted text-muted-foreground'
                }`}
              >
                ✅ Positiv
              </button>
              <button
                onClick={() => setAddType('negative')}
                className={`flex-1 py-2 rounded-xl text-xs font-display font-bold transition-all ${
                  addType === 'negative' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-muted text-muted-foreground'
                }`}
              >
                ❌ Negativ
              </button>
            </div>

            <div className="rounded-xl border border-border bg-background px-3 py-2.5 mb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Wiederholungen</span>
                <span className="font-display font-bold text-foreground">{addReps}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={addReps}
                onChange={(e) => setAddReps(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer mt-3"
                style={{
                  background: 'linear-gradient(90deg, oklch(0.7 0.18 145) 0%, oklch(0.55 0.25 285) 70%, oklch(0.6 0.22 25) 100%)',
                }}
              />
              <div className="mt-2 text-xs text-muted-foreground">
                AI-Score: {addReps >= 12 ? 'Hard' : addReps >= 6 ? 'Medium' : 'Easy'}
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Vorschläge</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_HABITS[addType].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleAddPreset(preset)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-muted hover:bg-primary/10 transition-colors border border-border"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Custom */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Eigenes Habit..."
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/40 transition-colors"
              />
              <button
                onClick={handleAddCustom}
                className="px-4 py-2.5 rounded-xl font-display font-bold text-xs text-white"
                style={{ background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))' }}
              >
                +
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
