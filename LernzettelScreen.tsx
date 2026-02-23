/**
 * Lernzettel als PDF: Thema oder Text eingeben → FYNIX erstellt einen Lernzettel → als PDF speichern.
 */
import { useState } from 'react';
import { useApp } from './AppContext';
import { motion } from 'framer-motion';
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ollamaChat, OLLAMA_TEXT_MODEL } from './lib/ollama';
import { jsPDF } from 'jspdf';

export default function LernzettelScreen() {
  const { setScreen } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState('Lernzettel');

  const generate = async () => {
    const text = input.trim();
    if (!text || text.length < 3) {
      toast.error('Gib ein Thema oder Text ein');
      return;
    }
    setLoading(true);
    setContent(null);
    try {
      const prompt = text.length < 100
        ? `Erstelle einen kurzen Lernzettel (Stichpunkte, übersichtlich) zum Thema: "${text}". Format: Überschrift, dann Stichpunkte mit Aufzählungszeichen. Maximal 1 Seite, auf Deutsch.`
        : `Fasse den folgenden Text als Lernzettel zusammen: Stichpunkte, übersichtlich. Überschrift oben, dann Aufzählung. Maximal 1 Seite, auf Deutsch.\n\n${text.slice(0, 3000)}`;
      const raw = await ollamaChat({ prompt, model: OLLAMA_TEXT_MODEL });
      const lines = raw.trim().split(/\n/).filter(Boolean);
      const firstLine = lines[0] || text.slice(0, 30);
      setTitle(firstLine.length > 50 ? 'Lernzettel' : firstLine.replace(/^#+\s*/, ''));
      setContent(raw.trim());
    } catch {
      const fallback = `Lernzettel: ${text.slice(0, 50)}\n\n• ${text.slice(0, 500).split(/\s+/).slice(0, 80).join(' ')}\n• Weitere Punkte ergänzen.`;
      setTitle('Lernzettel');
      setContent(fallback);
      toast.info('Offline-Vorschau. Für bessere Zettel Ollama starten.');
    }
    setLoading(false);
  };

  const downloadPdf = () => {
    if (!content) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;
    const lineHeight = 6;
    const maxW = pageW - margin * 2;

    doc.setFontSize(16);
    doc.text(title.slice(0, 80), margin, y);
    y += 12;

    doc.setFontSize(11);
    const lines = content.split(/\n/);
    for (const line of lines) {
      const trimmed = line.replace(/^[-*•]\s*/, '• ').trim();
      if (!trimmed) { y += lineHeight * 0.5; continue; }
      const wrapped = doc.splitTextToSize(trimmed, maxW);
      for (const part of wrapped) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(part, margin, y);
        y += lineHeight;
      }
    }

    doc.save(`Lernzettel_${title.slice(0, 30).replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF gespeichert!');
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => setScreen('home')} className="p-2 rounded-xl bg-card border border-border">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-lg">Lernzettel als PDF</h1>
      </div>
      <div className="px-5 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-2">Thema oder Text (z. B. „Fotosynthese“ oder Hefttext)</p>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Thema oder Lehrstoff einfügen …"
            className="w-full h-32 rounded-xl border border-border bg-background p-3 text-sm resize-none"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={generate}
          disabled={loading || !input.trim()}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {loading ? 'Wird erstellt …' : 'Lernzettel erstellen'}
        </motion.button>

        {content && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <h3 className="font-display font-bold text-sm mb-2">{title}</h3>
            <div className="text-sm text-foreground/90 whitespace-pre-line max-h-64 overflow-y-auto">
              {content}
            </div>
            <button
              onClick={downloadPdf}
              className="mt-4 w-full py-3 rounded-xl border border-primary bg-primary/10 text-primary font-display font-bold flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" /> Als PDF speichern
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
