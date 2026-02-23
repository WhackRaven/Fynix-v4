/**
 * Quiz aus Lehrstoff: Bild hochladen ODER Text einfügen → FYNIX erstellt ein Quiz daraus.
 * V2: Mit personalisiertem AI-Feedback pro Antwort & Zusammenfassung am Ende.
 */
import { useState } from 'react';
import { useApp } from './AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, ImagePlus, FileText, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ollamaChat, OLLAMA_TEXT_MODEL, OLLAMA_VISION_MODEL } from './lib/ollama';
import { extractTextFromImage } from './lib/imageAnalysis';
import { generatePersonalizedFeedback, generateCompletion } from './lib/ai';
import { MASCOT } from './assets';

type QuizItem = { question: string; answer: string; options: string[] };

function parseJsonFromText(text: string): { questions?: QuizItem[] } | null {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function imageToDataUrl(file: File, max = 1920): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('load'));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function buildFallbackQuiz(text: string): QuizItem[] {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  const items: QuizItem[] = [];
  for (let i = 0; i < Math.min(5, sentences.length); i++) {
    const correct = sentences[i];
    const others = sentences.filter((_, j) => j !== i).slice(0, 3);
    const options = [correct, ...others].sort(() => Math.random() - 0.5);
    items.push({
      question: `Was steht im Lehrstoff?`,
      answer: correct,
      options: options.length >= 4 ? options : [...options, 'Nicht genannt'],
    });
  }
  return items;
}

export default function QuizFromMaterialScreen() {
  const { setScreen, addXP, user, preferences } = useApp();
  const [mode, setMode] = useState<'image' | 'text'>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [locked, setLocked] = useState(false);

  // AI Feedback state
  const [aiFeedback, setAiFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [endSummary, setEndSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Track wrong answers for summary
  const [wrongAnswers, setWrongAnswers] = useState<{ question: string; userAnswer: string; correct: string }[]>([]);
  const [rightCount, setRightCount] = useState(0);

  const currentQuestion = quizItems[quizIndex];
  const hasContent = mode === 'image' ? imageFile : textInput.trim().length > 50;

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) {
      toast.error('Bitte ein Bild wählen');
      return;
    }
    setImageFile(file);
    try {
      const dataUrl = await imageToDataUrl(file);
      setImagePreview(dataUrl);
    } catch {
      toast.error('Bild konnte nicht geladen werden');
    }
  };

  const generateQuiz = async () => {
    let sourceText = '';
    if (mode === 'text') {
      sourceText = textInput.trim();
      if (sourceText.length < 30) {
        toast.error('Gib mehr Text ein (mind. 30 Zeichen)');
        return;
      }
    } else if (imageFile) {
      setLoading(true);
      try {
        const dataUrl = imagePreview || await imageToDataUrl(imageFile);
        try {
          const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          const raw = await ollamaChat({
            prompt: 'Lies den kompletten Text aus diesem Bild und gib ihn 1:1 wieder. Nur der Text, nichts anderes.',
            model: OLLAMA_VISION_MODEL,
            images: [base64],
          });
          sourceText = raw.trim();
        } catch {
          sourceText = await extractTextFromImage(dataUrl, 'deu+eng');
        }
        if (!sourceText || sourceText.length < 20) {
          toast.error('Im Bild wurde zu wenig Text erkannt. Versuche ein klareres Foto oder nutze „Text einfügen".');
          setLoading(false);
          return;
        }
      } catch (err) {
        toast.error('Bild konnte nicht ausgewertet werden');
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    if (!sourceText) return;

    setLoading(true);
    try {
      const prompt = `Erstelle genau 5 Multiple-Choice-Quizfragen auf Deutsch aus dem folgenden Lehrstoff. Jede Frage hat 4 Antwortoptionen, eine ist richtig. Antworte NUR mit diesem JSON, sonst nichts:\n{"questions":[{"question":"Frage?","answer":"richtige Antwort","options":["A","B","C","D"]}]}\n\nLehrstoff:\n${sourceText.slice(0, 4000)}`;
      const raw = await ollamaChat({ prompt, model: OLLAMA_TEXT_MODEL });
      const parsed = parseJsonFromText(raw);
      const list = parsed?.questions && Array.isArray(parsed.questions)
        ? parsed.questions
          .filter((q: any) => q.question && q.answer && Array.isArray(q.options))
          .map((q: any) => ({
            question: String(q.question).trim(),
            answer: String(q.answer).trim(),
            options: q.options.map((o: any) => String(o).trim()).filter(Boolean),
          }))
          .slice(0, 5)
        : [];
      const items = list.length >= 2 ? list : buildFallbackQuiz(sourceText);
      setQuizItems(items);
      setQuizIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setQuizDone(false);
      setLocked(false);
      setWrongAnswers([]);
      setRightCount(0);
      setAiFeedback('');
      setEndSummary('');
    } catch {
      const items = buildFallbackQuiz(sourceText);
      setQuizItems(items);
      setQuizIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setQuizDone(false);
      setLocked(false);
      setWrongAnswers([]);
      setRightCount(0);
      setAiFeedback('');
      setEndSummary('');
      toast.info('Quiz aus Lehrstoff erstellt (Offline-Modus)');
    }
    setLoading(false);
  };

  const handleAnswer = async (idx: number) => {
    if (!currentQuestion || locked) return;
    setLocked(true);
    setSelectedAnswer(idx);
    const correct = currentQuestion.options[idx] === currentQuestion.answer;
    if (correct) {
      setScore(s => s + 1);
      setRightCount(r => r + 1);
      addXP(20);
    } else {
      setWrongAnswers(prev => [...prev, {
        question: currentQuestion.question,
        userAnswer: currentQuestion.options[idx],
        correct: currentQuestion.answer,
      }]);
    }

    // AI Feedback generieren (async, nicht blockierend)
    setFeedbackLoading(true);
    setAiFeedback(correct ? '✅ Richtig!' : '❌ Leider falsch');

    generatePersonalizedFeedback(
      currentQuestion.question,
      currentQuestion.answer,
      currentQuestion.options[idx],
      correct,
      user?.name || 'du',
      user?.roastLevel || 3,
      preferences.language
    ).then(feedback => {
      setAiFeedback(feedback);
    }).catch(() => { }).finally(() => {
      setFeedbackLoading(false);
    });
  };

  const goNext = () => {
    if (quizIndex + 1 >= quizItems.length) {
      setQuizDone(true);
      generateEndSummary();
    } else {
      setQuizIndex(i => i + 1);
      setSelectedAnswer(null);
      setLocked(false);
      setAiFeedback('');
    }
  };

  const generateEndSummary = async () => {
    setSummaryLoading(true);
    try {
      const wrongList = wrongAnswers.map(w =>
        `Frage: "${w.question}" → Gewählt: "${w.userAnswer}", Richtig: "${w.correct}"`
      ).join('\n');

      const prompt = `Gib eine kurze, personalisierte Zusammenfassung (3-4 Sätze) für ${user?.name || 'den Schüler'}.
Ergebnis: ${rightCount + (quizItems[quizItems.length - 1] && selectedAnswer !== null && quizItems[quizItems.length - 1].options[selectedAnswer!] === quizItems[quizItems.length - 1].answer ? 1 : 0)} von ${quizItems.length} richtig.
${wrongAnswers.length > 0 ? `Fehler:\n${wrongList}` : 'Alles richtig!'}
Gib Tipps was zu üben ist und lobe die Stärken. Sei motivierend. Sprache: "${preferences.language}". Max 200 Zeichen.`;

      const res = await generateCompletion('', prompt, 'gpt-4o-mini', {
        systemPrompt: 'Du bist Fynix, ein witziger Lern-Begleiter. Schreibe eine kurze Zusammenfassung eines Quiz-Ergebnisses.',
        temperature: 0.8,
      });
      if (res.success && res.text.trim()) {
        setEndSummary(res.text.trim());
      } else {
        setEndSummary(getStaticSummary());
      }
    } catch {
      setEndSummary(getStaticSummary());
    } finally {
      setSummaryLoading(false);
    }
  };

  const getStaticSummary = () => {
    const total = quizItems.length;
    const right = score;
    if (right === total) return 'Perfekt! Alles richtig – du hast den Stoff drauf! 🏆';
    if (right >= total * 0.8) return 'Sehr gut! Fast alles richtig, nur Kleinigkeiten üben! 💪';
    if (right >= total * 0.5) return 'Solide Leistung! Schau dir die Fehler nochmal an. 📖';
    return 'Da ist noch Luft nach oben – übe die Themen nochmal durch! 📚';
  };

  // Quiz View with AI Feedback
  if (quizItems.length > 0 && !quizDone && currentQuestion) {
    return (
      <div className="min-h-dvh bg-background p-5 pt-14">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setQuizItems([]); }} className="p-2 rounded-xl bg-card border border-border">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-muted-foreground">Frage {quizIndex + 1} / {quizItems.length}</span>
        </div>
        <motion.div
          key={quizIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-display font-bold text-lg mb-4">{currentQuestion.question}</h3>
          <div className="space-y-2">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = opt === currentQuestion.answer;
              let style = 'border-border bg-card';
              if (selectedAnswer !== null) {
                if (isCorrect) style = 'border-green-500/50 bg-green-500/10';
                else if (isSelected) style = 'border-red-500/50 bg-red-500/10';
              }
              return (
                <motion.button
                  key={idx}
                  whileTap={!locked ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(idx)}
                  disabled={locked}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm ${style}`}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* AI Feedback Bubble */}
        <AnimatePresence>
          {selectedAnswer !== null && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mt-4 flex items-start gap-3"
            >
              <img src={MASCOT.happy} alt="Fynix" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="flex-1 px-4 py-3 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-display font-bold text-primary">Fynix sagt:</span>
                </div>
                <p className="text-sm text-foreground/80">
                  {feedbackLoading ? (
                    <span className="inline-flex items-center gap-1.5">
                      {aiFeedback}
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                    </span>
                  ) : aiFeedback}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weiter Button */}
        <AnimatePresence>
          {selectedAnswer !== null && !feedbackLoading && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={goNext}
              className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold active:scale-[0.98]"
            >
              {quizIndex + 1 >= quizItems.length ? 'Ergebnis anzeigen' : 'Nächste Frage'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Quiz Done with AI Summary
  if (quizItems.length > 0 && quizDone) {
    return (
      <div className="min-h-dvh bg-background p-5 pt-14 flex flex-col items-center justify-center text-center">
        <img
          src={score >= quizItems.length * 0.8 ? MASCOT.happy : score >= quizItems.length * 0.5 ? MASCOT.smug : MASCOT.crying}
          alt="Fynix"
          className="w-24 h-24 object-contain mb-4 drop-shadow-xl"
        />
        <h2 className="font-display font-bold text-2xl text-primary">Quiz geschafft!</h2>
        <p className="mt-2 text-muted-foreground">Du hast {score} von {quizItems.length} richtig.</p>

        {/* AI Summary */}
        <div className="mt-5 w-full max-w-sm px-4 py-4 rounded-2xl bg-card border border-border text-left">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-xs font-display font-bold text-primary">Fynix Feedback</span>
          </div>
          <p className="text-sm text-foreground/80">
            {summaryLoading ? (
              <span className="inline-flex items-center gap-1.5">
                Analysiere deine Antworten
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              </span>
            ) : endSummary}
          </p>
        </div>

        <button
          onClick={() => setQuizItems([])}
          className="mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold"
        >
          Neues Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => setScreen('home')} className="p-2 rounded-xl bg-card border border-border">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-lg">Quiz aus Lehrstoff</h1>
      </div>
      <div className="px-5 space-y-4">
        <div className="flex rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-display font-bold ${mode === 'image' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            <ImagePlus className="w-4 h-4" /> Bild
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-display font-bold ${mode === 'text' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            <FileText className="w-4 h-4" /> Text
          </button>
        </div>

        {mode === 'image' && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-3">Foto von Heft, Buch oder Arbeitsblatt</p>
            <label className="block w-full h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/50">
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              {imagePreview ? (
                <img src={imagePreview} alt="Vorschau" className="max-h-28 rounded-lg object-contain" />
              ) : (
                <>Bild auswählen</>
              )}
            </label>
          </div>
        )}

        {mode === 'text' && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-2">Lehrstoff einfügen (z. B. aus Heft oder Copy-Paste)</p>
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Text hier einfügen …"
              className="w-full h-40 rounded-xl border border-border bg-background p-3 text-sm resize-none"
            />
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={generateQuiz}
          disabled={loading || !hasContent}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {loading ? 'Quiz wird erstellt …' : 'Quiz erstellen'}
        </motion.button>
      </div>
    </div>
  );
}
