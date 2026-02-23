import { useMemo, useState } from 'react';
import { useApp } from './AppContext';
import { MASCOT } from './assets';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getVocabFeedback } from './lib/vocabFeedback';
import { useT } from './i18n';
import { ollamaChat, OLLAMA_TEXT_MODEL, OLLAMA_VISION_MODEL } from './lib/ollama';
import { getImageComment, extractTextFromImage } from './lib/imageAnalysis';

type QuizMode = 'mc' | 'input';
type QuizDirection = 'source-target' | 'target-source' | 'mixed';
type QuizItem = { question: string; answer: string; options?: string[] };

function parseJsonFromText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
        return JSON.parse(trimmed);
    } catch {
        const match = trimmed.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }
}

function getBase64FromDataUrl(dataUrl: string) {
    const parts = dataUrl.split(',');
    return parts.length > 1 ? parts[1] : dataUrl;
}

function normalizeVocabText(text: string): string {
    return text
        .replace(/\t/g, ' - ')
        .replace(/[\u2013\u2014\u2015\u2212\u2010\u2011]/g, ' - ')
        .replace(/\s*[=:]\s*/g, ' - ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function parsePairsFromText(text: string): Array<{ term: string; translation: string }> {
    const normalized = normalizeVocabText(text);
    const lines = normalized
        .split(/\r?\n/)
        .map(line => line.replace(/^[-*•·\s]+/, '').trim())
        .filter(Boolean);
    const items: Array<{ term: string; translation: string }> = [];

    for (const line of lines) {
        const sep =
            line.includes(' - ') ? ' - ' :
                line.includes(' – ') ? ' – ' :
                    line.includes(' : ') ? ' : ' :
                        line.includes(' / ') ? ' / ' :
                            line.includes('\t') ? '\t' :
                                / [=:] /.test(line) ? line.match(/\s[=:]\s/)?.[0] : null;
        if (sep) {
            const parts = line.split(sep);
            if (parts.length >= 2) {
                const term = parts[0].trim();
                const translation = parts.slice(1).join(sep).trim();
                if (term && translation && term.length < 200) items.push({ term, translation });
            }
            continue;
        }
        if (line.includes(':') && !line.startsWith('http')) {
            const idx = line.indexOf(':');
            const term = line.slice(0, idx).trim();
            const translation = line.slice(idx + 1).trim();
            if (term && translation && term.length < 200) items.push({ term, translation });
            continue;
        }
        if (line.includes('=')) {
            const idx = line.indexOf('=');
            const term = line.slice(0, idx).trim();
            const translation = line.slice(idx + 1).trim();
            if (term && translation && term.length < 200) items.push({ term, translation });
            continue;
        }
        const paren = line.match(/^(.+?)\s*[(\[]([^)\]]+)[)\]]\s*$/);
        if (paren) {
            const term = paren[1].trim();
            const translation = paren[2].trim();
            if (term && translation && term.length < 200) items.push({ term, translation });
        }
    }

    if (items.length === 0 && lines.length >= 2) {
        for (let i = 0; i < lines.length - 1; i += 2) {
            const term = lines[i].trim();
            const translation = lines[i + 1].trim();
            if (term && translation && term.length < 200 && !/^\d+$/.test(term))
                items.push({ term, translation });
        }
    }
    return items;
}

async function imageFileToDataUrl(file: File, maxSize = 1280) {
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('image_load_failed'));
            image.src = url;
        });
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas_failed');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.88);
    } finally {
        URL.revokeObjectURL(url);
    }
}

function buildLocalQuiz(
    entries: Array<{ term: string; translation: string }>,
    sourceLang: string,
    targetLang: string,
    mode: QuizMode,
    direction: QuizDirection
): QuizItem[] {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    const total = Math.min(5, shuffled.length);
    const pickOptions = (answer: string, pool: string[]) => {
        const options = new Set([answer]);
        while (options.size < Math.min(4, pool.length)) {
            options.add(pool[Math.floor(Math.random() * pool.length)]);
        }
        return Array.from(options).sort(() => Math.random() - 0.5);
    };
    return shuffled.slice(0, total).map(entry => {
        const dir = direction === 'mixed' ? (Math.random() > 0.5 ? 'source-target' : 'target-source') : direction;
        const question = dir === 'source-target'
            ? `Übersetze (${sourceLang} → ${targetLang}): ${entry.term}`
            : `Übersetze (${targetLang} → ${sourceLang}): ${entry.translation}`;
        const answer = dir === 'source-target' ? entry.translation : entry.term;
        if (mode === 'mc') {
            const pool = dir === 'source-target' ? entries.map(e => e.translation) : entries.map(e => e.term);
            return { question, answer, options: pickOptions(answer, pool) };
        }
        return { question, answer };
    });
}

export default function VocabScreen() {
    const {
        user,
        setScreen,
        getRoast,
        vocabLists,
        addVocabList,
        addVocabEntries,
        addVocabEntry,
        removeVocabEntry,
        updateVocabEntry,
    } = useApp();

    const [listName, setListName] = useState('');
    const [sourceLang, setSourceLang] = useState('Deutsch');
    const [targetLang, setTargetLang] = useState('Englisch');
    const [selectedListId, setSelectedListId] = useState<string | null>(vocabLists[0]?.id ?? null);
    const [termInput, setTermInput] = useState('');
    const [translationInput, setTranslationInput] = useState('');

    const [scanImageData, setScanImageData] = useState<string | null>(null);
    const [scanImageName, setScanImageName] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const [quizMode, setQuizMode] = useState<QuizMode>('mc');
    const [quizDirection, setQuizDirection] = useState<QuizDirection>('source-target');
    const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizAnswer, setQuizAnswer] = useState('');
    const [quizActive, setQuizActive] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerLocked, setAnswerLocked] = useState(false);
    const [lynixComment, setLynixComment] = useState('');
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [vocabFeedbackMessage, setVocabFeedbackMessage] = useState('');

    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [editTerm, setEditTerm] = useState('');
    const [editTranslation, setEditTranslation] = useState('');

    const languages = ['Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Italienisch', 'Latein', 'Türkisch', 'Arabisch', 'Russisch', 'Polnisch', 'Niederländisch'];

    const selectedList = useMemo(
        () => vocabLists.find(list => list.id === selectedListId) ?? null,
        [vocabLists, selectedListId]
    );

    const handleCreateList = () => {
        if (!listName.trim()) {
            toast.error('Gib deiner Liste einen Namen');
            return;
        }
        const id = addVocabList(listName.trim(), sourceLang, targetLang);
        setSelectedListId(id);
        setListName('');
        toast.success('Liste erstellt');
    };

    const handleAddEntry = () => {
        if (!selectedListId) {
            toast.error('Wähle zuerst eine Liste');
            return;
        }
        if (!termInput.trim() || !translationInput.trim()) {
            toast.error('Fülle beide Felder aus');
            return;
        }
        addVocabEntry(selectedListId, { term: termInput.trim(), translation: translationInput.trim() });
        setTermInput('');
        setTranslationInput('');
        toast.success('Vokabel hinzugefügt');
    };

    const handleScan = async () => {
        if (!selectedListId) {
            toast.error('Wähle zuerst eine Liste');
            return;
        }
        if (!scanImageData) {
            toast.error('Wähle ein Bild zum Scannen');
            return;
        }
        setIsScanning(true);
        const roastLevel = user?.roastLevel ?? 3;

        try {
            const prompt = `Lies den Text im Bild (OCR) und gib nur JSON im Format {"items":[{"term":"...","translation":"..."}]}. Jede Zeile ist ein Begriff-Übersetzung Paar.`;
            const imageBase64 = getBase64FromDataUrl(scanImageData);
            const raw = await ollamaChat({ prompt, model: OLLAMA_VISION_MODEL, images: [imageBase64] });
            const parsed = parseJsonFromText(raw);
            const items = parsed?.items || parsed?.vocab || parsed?.vokabeln;
            const normalized = Array.isArray(items)
                ? items
                    .map((item: any) => ({ term: String(item.term || item.word || '').trim(), translation: String(item.translation || item.meaning || '').trim() }))
                    .filter((item: any) => item.term && item.translation)
                : [];
            const fallback = normalized.length > 0 ? normalized : parsePairsFromText(raw);
            if (fallback.length > 0) {
                addVocabEntries(selectedListId, fallback);
                setScanImageData(null);
                setScanImageName('');
                const comment = await getImageComment(scanImageData, roastLevel);
                toast.success(`${fallback.length} Vokabeln importiert`, { description: comment });
                return;
            }
        } catch (_) {
        }

        try {
            const comment = await getImageComment(scanImageData, roastLevel);
            const text = await extractTextFromImage(scanImageData, 'deu+eng');
            const pairs = parsePairsFromText(text);
            if (pairs.length > 0) {
                addVocabEntries(selectedListId, pairs);
                setScanImageData(null);
                setScanImageName('');
                toast.success(`Offline-Erkennung: ${pairs.length} Vokabeln`, { description: comment });
            } else {
                toast.info(comment, { description: 'Kein Vokabel-Text erkannt. Probiere ein klareres Bild oder trage manuell ein.' });
            }
        } catch (offlineError) {
            const comment = await getImageComment(scanImageData, roastLevel).catch(() => 'Bild geladen.');
            toast.info(comment, { description: 'Text konnte nicht erkannt werden. Vokabeln manuell eintragen oder Ollama starten.' });
        } finally {
            setIsScanning(false);
        }
    };

    const handleImagePick = async (file?: File | null) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Bitte nur Bilder hochladen');
            return;
        }
        try {
            const dataUrl = await imageFileToDataUrl(file, 1920);
            setScanImageData(dataUrl);
            setScanImageName(file.name);
        } catch {
            toast.error('Bild konnte nicht verarbeitet werden');
        }
    };

    const startQuiz = async () => {
        if (!selectedList || selectedList.entries.length < 2) {
            toast.error('Füge mindestens zwei Vokabeln hinzu');
            return;
        }
        setIsGeneratingQuiz(true);
        setQuizActive(false);
        try {
            const directionText = quizDirection === 'mixed' ? 'gemischt' : quizDirection === 'source-target'
                ? `${selectedList.sourceLang} → ${selectedList.targetLang}`
                : `${selectedList.targetLang} → ${selectedList.sourceLang}`;
            const modeText = quizMode === 'mc' ? 'Multiple Choice' : 'Eingabe';
            const prompt = `Erstelle ein kurzes Vokabelquiz (${modeText}, Richtung: ${directionText}). Antworte ausschließlich mit JSON im Format {"questions":[{"question":"...","answer":"...","options":["..."]}]}. Nutze diese Vokabeln:\n${selectedList.entries.map(e => `${e.term} - ${e.translation}`).join('\n')}`;
            const raw = await ollamaChat({ prompt, model: OLLAMA_TEXT_MODEL });
            const parsed = parseJsonFromText(raw);
            const questions = Array.isArray(parsed?.questions) ? parsed.questions : null;
            const normalized: QuizItem[] = questions
                ? questions.map((q: any) => ({
                    question: String(q.question || '').trim(),
                    answer: String(q.answer || '').trim(),
                    options: Array.isArray(q.options) ? q.options.map((o: any) => String(o).trim()).filter(Boolean) : undefined,
                })).filter((q: QuizItem) => q.question && q.answer)
                : [];
            const items = normalized.length > 0
                ? normalized
                : buildLocalQuiz(selectedList.entries, selectedList.sourceLang, selectedList.targetLang, quizMode, quizDirection);
            setQuizItems(items);
            setQuizIndex(0);
            setQuizScore(0);
            setQuizAnswer('');
            setQuizFeedback(null);
            setSelectedOption(null);
            setAnswerLocked(false);
            setQuizFinished(false);
            setLynixComment('');
            setQuizActive(true);
        } catch (error) {
            const items = buildLocalQuiz(selectedList.entries, selectedList.sourceLang, selectedList.targetLang, quizMode, quizDirection);
            setQuizItems(items);
            setQuizIndex(0);
            setQuizScore(0);
            setQuizAnswer('');
            setQuizFeedback(null);
            setSelectedOption(null);
            setAnswerLocked(false);
            setQuizFinished(false);
            setLynixComment('');
            setQuizActive(true);
            const message = error instanceof Error ? error.message : '';
            if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
                toast.error('Ollama nicht erreichbar. Quiz läuft im Offline-Modus.');
            } else {
                toast.error('KI-Quiz fehlgeschlagen. Offline-Quiz gestartet.');
            }
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const handleAnswer = (answer: string) => {
        const current = quizItems[quizIndex];
        if (!current || answerLocked || !user) return;
        setAnswerLocked(true);
        setSelectedOption(answer);
        const isCorrect = answer.trim().toLowerCase() === current.answer.trim().toLowerCase();
        setQuizFeedback(isCorrect ? 'correct' : 'wrong');
        const feedback = getVocabFeedback(current.answer, isCorrect, user.roastLevel);
        setVocabFeedbackMessage(feedback);
        const nextScore = isCorrect ? quizScore + 1 : quizScore;
        if (isCorrect) setQuizScore(nextScore);
        const nextIndex = quizIndex + 1;
        setTimeout(() => {
            if (nextIndex >= quizItems.length) {
                const ratio = nextScore / quizItems.length;
                const comment = ratio >= 0.8
                    ? 'Lynix: Stark! Du hast richtig abgeliefert. 🔥'
                    : ratio >= 0.5
                        ? 'Lynix: Solide Runde. Jetzt noch schärfer fokussieren.'
                        : `Lynix: ${getRoast()}`;
                setLynixComment(comment);
                setQuizFinished(true);
                return;
            }
            setQuizIndex(nextIndex);
            setQuizAnswer('');
            setQuizFeedback(null);
            setSelectedOption(null);
            setAnswerLocked(false);
            setVocabFeedbackMessage('');
        }, 900);
    };

    const closeQuiz = () => {
        setQuizActive(false);
        setQuizFinished(false);
        setQuizFeedback(null);
        setSelectedOption(null);
        setAnswerLocked(false);
        setQuizAnswer('');
    };

    if (!user) return null;

    return (
        <div className="bg-black text-white h-dvh w-full relative overflow-y-auto pb-4">
            {/* Background ambient */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, oklch(0.55 0.25 285 / 0.1) 0%, transparent 50%)' }} />

            {/* Header Overview */}
            <div className="relative flex items-center p-5 pt-12 z-10 sticky top-0 bg-black/60 backdrop-blur-md">
                <button onClick={() => setScreen('home')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="ml-4 font-display font-bold text-lg">{useT('vocab')}</span>
            </div>

            <div className="px-5 relative z-10 space-y-4">
                {/* Create List */}
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-sm font-display font-bold mb-2">Neue Liste</p>
                    <div className="flex items-center gap-2">
                        <input
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            placeholder="z.B. Englisch Unit 3"
                            className="flex-1 h-10 rounded-xl border border-border bg-background px-3 text-sm"
                        />
                        <button
                            onClick={handleCreateList}
                            className="h-10 px-4 rounded-xl text-xs font-display font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))' }}
                        >
                            Plus
                        </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <select
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="h-10 rounded-xl border border-border bg-background px-2 text-sm text-foreground"
                        >
                            {languages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="h-10 rounded-xl border border-border bg-background px-2 text-sm text-foreground"
                        >
                            {languages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* List Selection */}
                <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-display font-bold">Deine Listen</p>
                        <span className="text-xs text-muted-foreground">{selectedList?.entries.length || 0} Vokabeln</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {vocabLists.length === 0 && (
                            <span className="text-xs text-muted-foreground">Noch keine Listen vorhanden.</span>
                        )}
                        {vocabLists.map(list => (
                            <button
                                key={list.id}
                                onClick={() => setSelectedListId(list.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs border ${selectedListId === list.id ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground bg-background'}`}
                            >
                                {list.name}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedListId && selectedList && (
                    <>
                        {/* Add/Scan Vocab */}
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <p className="text-sm font-display font-bold mb-3">Vokabeln hinzufügen</p>

                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    value={termInput}
                                    onChange={(e) => setTermInput(e.target.value)}
                                    placeholder={selectedList ? selectedList.sourceLang : 'Begriff'}
                                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                                />
                                <input
                                    value={translationInput}
                                    onChange={(e) => setTranslationInput(e.target.value)}
                                    placeholder={selectedList ? selectedList.targetLang : 'Übersetzung'}
                                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                                />
                            </div>
                            <button
                                onClick={handleAddEntry}
                                className="mt-3 w-full h-10 rounded-xl text-xs font-display font-bold text-white bg-white/10"
                            >
                                Manuell hinzufügen
                            </button>

                            <div className="w-full h-[1px] bg-border my-4" />

                            <p className="text-sm font-display font-bold">Smart Scan</p>
                            <p className="text-xs text-muted-foreground mt-1 mb-3">Fotografiere eine Liste, die KI liest sie ein.</p>
                            <label className="block w-full">
                                <div className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm flex items-center justify-between">
                                    <span className="text-muted-foreground truncate">{scanImageName || 'Bild auswählen (JPG/PNG)'}</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImagePick(e.target.files?.[0])}
                                    className="hidden"
                                />
                            </label>
                            {scanImageData && (
                                <div className="mt-3 rounded-xl border border-border bg-background p-3">
                                    <img src={scanImageData} alt="Scan Vorschau" className="w-full max-h-48 object-cover rounded-lg" />
                                    <button onClick={() => { setScanImageData(null); setScanImageName(''); }} className="mt-2 text-xs text-muted-foreground">Bild entfernen</button>
                                </div>
                            )}
                            <button
                                onClick={handleScan}
                                disabled={isScanning}
                                className="mt-3 w-full h-10 rounded-xl text-xs font-display font-bold text-white disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))' }}
                            >
                                {isScanning ? useT('vocabScanning') : useT('vocabScan')}
                            </button>
                        </div>

                        {/* Vocab Quiz Start */}
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <p className="text-sm font-display font-bold mb-3">Quiz Konfiguration</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setQuizMode('mc')}
                                    className={`h-10 rounded-xl text-xs font-display font-bold border ${quizMode === 'mc' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground bg-background'}`}
                                >
                                    Multiple Choice
                                </button>
                                <button
                                    onClick={() => setQuizMode('input')}
                                    className={`h-10 rounded-xl text-xs font-display font-bold border ${quizMode === 'input' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground bg-background'}`}
                                >
                                    Eingabe
                                </button>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setQuizDirection('source-target')}
                                    className={`h-9 rounded-xl text-[11px] font-display font-bold border ${quizDirection === 'source-target' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground bg-background'}`}
                                >
                                    {selectedList?.sourceLang || 'A'} → {selectedList?.targetLang || 'B'}
                                </button>
                                <button
                                    onClick={() => setQuizDirection('target-source')}
                                    className={`h-9 rounded-xl text-[11px] font-display font-bold border ${quizDirection === 'target-source' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground bg-background'}`}
                                >
                                    {selectedList?.targetLang || 'B'} → {selectedList?.sourceLang || 'A'}
                                </button>
                                <button
                                    onClick={() => setQuizDirection('mixed')}
                                    className={`h-9 rounded-xl text-[11px] font-display font-bold border ${quizDirection === 'mixed' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground bg-background'}`}
                                >
                                    Gemischt
                                </button>
                            </div>
                            <button
                                onClick={startQuiz}
                                disabled={isGeneratingQuiz}
                                className="mt-4 w-full h-12 rounded-xl text-sm font-display font-bold text-white disabled:opacity-60 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                style={{ background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))' }}
                            >
                                {isGeneratingQuiz ? 'Quiz wird gebaut...' : useT('vocabQuizStart')}
                            </button>
                        </div>

                        {/* Manage List */}
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <p className="text-sm font-display font-bold mb-3">{useT('vocabCollection')}</p>
                            {selectedList.entries.length === 0 ? (
                                <p className="text-xs text-muted-foreground">{useT('noVocabInList')}</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedList.entries.map(entry => (
                                        <div key={entry.id} className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background/50">
                                            {editingEntryId === entry.id ? (
                                                <>
                                                    <input
                                                        value={editTerm}
                                                        onChange={(e) => setEditTerm(e.target.value)}
                                                        className="flex-1 min-w-0 h-9 rounded-lg border border-border bg-card px-2 text-xs"
                                                    />
                                                    <input
                                                        value={editTranslation}
                                                        onChange={(e) => setEditTranslation(e.target.value)}
                                                        className="flex-1 min-w-0 h-9 rounded-lg border border-border bg-card px-2 text-xs"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (editTerm.trim() && editTranslation.trim()) {
                                                                updateVocabEntry(selectedList.id, entry.id, { term: editTerm.trim(), translation: editTranslation.trim() });
                                                                setEditingEntryId(null);
                                                                toast.success(useT('save'));
                                                            }
                                                        }}
                                                        className="shrink-0 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                                                    >
                                                        OK
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="block font-medium truncate text-sm">{entry.term}</span>
                                                        <span className="block text-muted-foreground truncate text-xs mt-0.5">{entry.translation}</span>
                                                    </div>
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => { setEditingEntryId(entry.id); setEditTerm(entry.term); setEditTranslation(entry.translation); }}
                                                        className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => { removeVocabEntry(selectedList.id, entry.id); toast.success(useT('delete')); }}
                                                        className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </motion.button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Quiz Modal Overlays the Feed */}
            <AnimatePresence>
                {quizActive && quizItems[quizIndex] && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col"
                    >
                        <div className="flex items-center justify-between p-5 pt-12 border-b border-border">
                            <div>
                                <span className="font-display font-bold text-lg text-primary">{useT('quizTime')}</span>
                                <p className="text-xs text-muted-foreground">{selectedList?.name || 'Vokabelquiz'}</p>
                            </div>
                            <button onClick={closeQuiz} className="text-sm bg-white/10 px-4 py-2 rounded-full font-bold">
                                Schließen
                            </button>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                            {!quizFinished ? (
                                <>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-4">
                                        <span>Frage {quizIndex + 1} / {quizItems.length}</span>
                                        <span>Score: {quizScore}</span>
                                    </div>
                                    <h3 className="font-display text-2xl font-extrabold mb-8 text-center mt-8">
                                        {quizItems[quizIndex].question}
                                    </h3>

                                    <div className="space-y-4 w-full max-w-sm mx-auto">
                                        {quizMode === 'mc' ? (
                                            quizItems[quizIndex].options?.map(option => {
                                                const isCorrect = option === quizItems[quizIndex].answer;
                                                const isSelected = option === selectedOption;

                                                let bgClasses = 'bg-card border-border hover:border-primary/50 text-foreground';
                                                if (selectedOption !== null) {
                                                    if (isCorrect) bgClasses = 'bg-green-500/20 border-green-500 text-green-400';
                                                    else if (isSelected) bgClasses = 'bg-red-500/20 border-red-500 text-red-400';
                                                    else bgClasses = 'bg-card border-border opacity-50 text-foreground';
                                                }

                                                return (
                                                    <button
                                                        key={option}
                                                        onClick={() => !answerLocked && handleAnswer(option)}
                                                        disabled={answerLocked}
                                                        className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-base font-medium transition-all active:scale-[0.98] ${bgClasses}`}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="mt-4">
                                                <input
                                                    value={quizAnswer}
                                                    onChange={(e) => setQuizAnswer(e.target.value)}
                                                    placeholder="Deine Antwort"
                                                    className="w-full h-14 rounded-xl border-2 border-border bg-card px-4 text-lg mb-4 focus:border-primary focus:outline-none"
                                                    disabled={answerLocked}
                                                />
                                                <button
                                                    onClick={() => !answerLocked && handleAnswer(quizAnswer)}
                                                    disabled={answerLocked}
                                                    className="w-full h-14 rounded-xl text-base font-display font-bold text-white shadow-lg"
                                                    style={{ background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))' }}
                                                >
                                                    Prüfen
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {quizFeedback && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                className={`mt-6 w-full max-w-sm mx-auto p-4 rounded-xl text-center font-bold ${quizFeedback === 'correct' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                                            >
                                                {quizFeedback === 'correct' ? useT('correct') : `${useT('wrong')}. ${useT('correct')}: ${quizItems[quizIndex].answer}`}
                                                {vocabFeedbackMessage && <div className="mt-2 text-sm italic opacity-80 font-normal">{vocabFeedbackMessage}</div>}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <img src={MASCOT.smug} alt="Lynix" className="w-32 h-32 object-contain drop-shadow-2xl" />
                                    <p className="mt-6 text-3xl font-display font-extrabold">{useT('quizFinished')}</p>
                                    <p className="text-xl text-primary mt-2 font-display">{useT('score')}: {quizScore} / {quizItems.length}</p>
                                    <p className="mt-6 text-foreground/80 max-w-xs">{lynixComment}</p>

                                    <button
                                        onClick={closeQuiz}
                                        className="mt-12 w-full max-w-xs h-14 rounded-full text-lg font-display font-bold text-white shadow-lg"
                                        style={{ background: 'linear-gradient(135deg, oklch(0.45 0.25 285), oklch(0.6 0.22 285))' }}
                                    >
                                        Klasse!
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
