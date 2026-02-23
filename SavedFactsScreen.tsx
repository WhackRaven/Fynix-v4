import { useApp } from './AppContext';
import { ArrowLeft, Trash2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SavedFactsScreen() {
    const { setScreen, savedFacts, removeSavedFact } = useApp();

    return (
        <div className="min-h-dvh relative bg-background flex flex-col">
            {/* Header */}
            <div className="relative z-20 flex items-center gap-4 px-5 pt-12 pb-4 bg-card border-b border-border shadow-sm">
                <button onClick={() => setScreen('profile')} className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center active:scale-95 transition-transform">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="font-display text-lg font-extrabold flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-primary fill-primary/20" />
                    Gespeicherte Fakten
                </h1>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                <AnimatePresence>
                    {savedFacts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center px-4"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Bookmark className="w-8 h-8 text-primary opacity-50" />
                            </div>
                            <p className="font-display font-bold text-lg mb-2">Noch keine Fakten gespeichert</p>
                            <p className="text-sm text-muted-foreground">Gehe in den Feed und speichere spannende Fakten, um sie hier wiederzufinden!</p>
                            <button
                                onClick={() => setScreen('feed')}
                                className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-display font-bold rounded-xl active:scale-95 transition-transform"
                            >
                                Zum Feed
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            {savedFacts.map((fact) => (
                                <motion.div
                                    key={fact.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-card border border-border rounded-2xl p-4 shadow-sm relative group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-display font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                            {fact.category}
                                        </span>
                                        <button
                                            onClick={() => {
                                                removeSavedFact(fact.id);
                                                toast('Fakt entfernt');
                                            }}
                                            className="p-1.5 text-muted-foreground hover:text-red-400 active:scale-95 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="font-display font-bold text-base mb-1.5 leading-tight">{fact.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {fact.content}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
