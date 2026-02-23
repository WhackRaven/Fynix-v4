import { useState, useMemo } from 'react';
import { useApp } from './AppContext';
import { MASCOT } from './assets';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, TrendingUp, TrendingDown, Wallet, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = {
  income: ['Taschengeld', 'Nebenjob', 'Geschenk', 'Verkauf', 'Sonstiges'],
  expense: ['Essen', 'Kleidung', 'Gaming', 'Handy', 'Transport', 'Freizeit', 'Sonstiges'],
};

export default function MoneyScreen() {
  const { money, addMoneyEntry, removeMoneyEntry, setScreen, addXP } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [autoCategory, setAutoCategory] = useState(true);

  const stats = useMemo(() => {
    const thisMonth = money.filter(m => {
      const d = new Date(m.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = thisMonth.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
    const expense = thisMonth.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
    return { income, expense, balance: income - expense, entries: thisMonth };
  }, [money]);

  const detectCategory = (type: 'income' | 'expense', text: string) => {
    const t = text.toLowerCase();
    if (type === 'expense') {
      if (/(döner|burger|pizza|snack|essen|kebab)/i.test(t)) return 'Essen';
      if (/(steam|ps|xbox|game|gaming)/i.test(t)) return 'Gaming';
      if (/(handy|phone|iphone|android|vertrag|prepaid)/i.test(t)) return 'Handy';
      if (/(bus|bahn|uber|taxi|ticket)/i.test(t)) return 'Transport';
      if (/(kino|party|festival|konzert|freizeit)/i.test(t)) return 'Freizeit';
      if (/(hoodie|shirt|schuhe|jacke|kleidung)/i.test(t)) return 'Kleidung';
      return 'Sonstiges';
    }
    if (/(job|lohn|arbeit|gagen)/i.test(t)) return 'Nebenjob';
    if (/(taschen|eltern|pocket)/i.test(t)) return 'Taschengeld';
    if (/(geschenk|geburtstag)/i.test(t)) return 'Geschenk';
    if (/(verkauf|vinted|ebay|secondhand)/i.test(t)) return 'Verkauf';
    return 'Sonstiges';
  };

  const suggestedCategory = note.trim() ? detectCategory(addType, note) : CATEGORIES[addType][0];

  const handleAdd = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast.error('Gib einen gültigen Betrag ein! 💸');
      return;
    }
    const finalCategory = category || (autoCategory ? suggestedCategory : '');
    if (!finalCategory) {
      toast.error('Wähl eine Kategorie! 📂');
      return;
    }
    const nextBalance = stats.balance + (addType === 'income' ? num : -num);
    const crossedMilestone = stats.balance < 100 && nextBalance >= 100;
    addMoneyEntry({
      amount: num,
      type: addType,
      category: finalCategory,
      note: note.trim(),
      date: new Date().toISOString(),
    });
    if (addType === 'income') {
      const xpGain = Math.min(30, Math.max(5, Math.round(num / 10)));
      addXP(xpGain);
      toast.success(`+${xpGain} XP fürs Sparen! 💰`);
    }
    if (crossedMilestone) {
      addXP(50);
      toast.success('MoneyMaster erreicht! 👑', { description: '+50 XP Bonus' });
    }
    setAmount('');
    setCategory('');
    setNote('');
    setShowAdd(false);
    toast.success(addType === 'income' ? 'Einnahme gespeichert! 💰' : 'Ausgabe gespeichert! 📝');
  };

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.6 0.2 80 / 0.08) 0%, transparent 50%)' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
        <button onClick={() => setScreen('home')} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display text-lg font-extrabold">Money</h1>
        <div className="w-9 h-9" />
      </div>

      {/* Balance Card */}
      <div className="relative z-10 mx-5 mt-2">
        <div className="rounded-3xl p-5 border border-primary/15"
          style={{
            background: 'linear-gradient(135deg, oklch(0.18 0.03 285), oklch(0.22 0.04 285))',
            boxShadow: '0 0 30px oklch(0.55 0.25 285 / 0.08)',
          }}>
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Diesen Monat</span>
          </div>
          <div className="flex items-center justify-between">
            <p className={`font-display text-3xl font-extrabold ${stats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(2)}€
            </p>
            {stats.balance >= 100 && (
              <span className="px-2.5 py-1 rounded-xl text-xs font-display font-bold border border-primary/30 text-primary">
                MoneyMaster
              </span>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Einnahmen</p>
                <p className="font-display font-bold text-sm text-emerald-400">+{stats.income.toFixed(2)}€</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ausgaben</p>
                <p className="font-display font-bold text-sm text-red-400">-{stats.expense.toFixed(2)}€</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="relative z-10 px-5 mt-5">
        <h2 className="font-display font-bold text-sm mb-3">Letzte Einträge</h2>

        {stats.entries.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <img src={MASCOT.sleepy} alt="Fynix" className="w-20 h-20 object-contain opacity-50" />
            <p className="text-sm text-muted-foreground mt-3">Noch keine Einträge diesen Monat.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...stats.entries].reverse().slice(0, 20).map((entry) => (
              <motion.div
                key={entry.id}
                layout
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  entry.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}>
                  {entry.type === 'income'
                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                    : <TrendingDown className="w-4 h-4 text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.category}</p>
                  {entry.note && <p className="text-xs text-muted-foreground truncate">{entry.note}</p>}
                </div>
                <p className={`font-display font-bold text-sm ${entry.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {entry.type === 'income' ? '+' : '-'}{entry.amount.toFixed(2)}€
                </p>
                <button
                  onClick={() => removeMoneyEntry(entry.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/30 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Button */}
      <div className="relative z-10 px-5 mt-4 pb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(!showAdd)}
          className="w-full py-3.5 rounded-2xl border border-dashed border-primary/30 flex items-center justify-center gap-2 text-sm font-display font-bold text-primary/70 hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Eintrag hinzufügen
        </motion.button>
      </div>

      {/* Add Panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdd(false)} />
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="relative w-full max-w-[430px] rounded-t-3xl border border-border bg-card p-5 pb-10"
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

              {/* Type Toggle */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setAddType('income')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-display font-bold transition-all ${
                    addType === 'income' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  💰 Einnahme
                </button>
                <button
                  onClick={() => setAddType('expense')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-display font-bold transition-all ${
                    addType === 'expense' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  💸 Ausgabe
                </button>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Betrag</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-lg font-display font-bold outline-none focus:border-primary/40 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-display font-bold">€</span>
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Kategorie</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES[addType].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        category === cat
                          ? 'bg-primary/15 text-primary border border-primary/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Auto-Kategorie</span>
                  <button
                    onClick={() => setAutoCategory(!autoCategory)}
                    className={`px-2 py-1 rounded-lg border ${
                      autoCategory ? 'border-primary/40 text-primary' : 'border-border text-muted-foreground'
                    }`}
                  >
                    {autoCategory ? 'An' : 'Aus'}
                  </button>
                </div>
                {autoCategory && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Vorschlag: {suggestedCategory}
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notiz (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="z.B. Döner am Bahnhof"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <button
                onClick={handleAdd}
                className="w-full py-4 rounded-2xl font-display font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))',
                  boxShadow: '0 0 20px oklch(0.55 0.25 285 / 0.3)',
                }}
              >
                Speichern
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
