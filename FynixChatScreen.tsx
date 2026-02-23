/**
 * FYNIX-Chat: Fragen zu Schulthemen. KI = FYNIX. Optional: Mit FYNIX sprechen (Sprachaufnahme).
 */
import { useState, useRef, useEffect } from 'react';
import { useApp } from './AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { chatWithAI } from './lib/ai';
import { MASCOT } from './assets';

const FYNIX_SYSTEM = `Du bist FYNIX, der freundliche Lern-Assistent der Fynix-App. Du hilfst bei Schulthemen: Erklärungen, Übungen, Definitionen. Antworte kurz, klar und auf Deutsch. Sei motivierend.`;

type Message = { role: 'user' | 'assistant'; content: string };

export default function FynixChatScreen() {
  const { setScreen, preferences } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: trimmed };
    setMessages(m => [...m, userMsg]);
    setLoading(true);
    try {
      const chatMessages = [
        { role: 'system' as const, content: FYNIX_SYSTEM },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: trimmed },
      ];
      const reply = await chatWithAI(preferences.aiUrl, chatMessages, trimmed);

      if (reply.success) {
        setMessages(m => [...m, { role: 'assistant', content: reply.text }]);
        if (speakEnabled && typeof speechSynthesis !== 'undefined') {
          const u = new SpeechSynthesisUtterance(reply.text.slice(0, 300));
          u.lang = 'de-DE';
          u.rate = 0.95;
          speechSynthesis.speak(u);
        }
      } else {
        throw new Error(reply.error);
      }
    } catch {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'FYNIX ist gerade offline. Starte Ollama auf deinem Gerät (z.B. localhost:11434), dann kann ich wieder antworten! 📚',
      }]);
      toast.error('Ollama nicht erreichbar');
    }
    setLoading(false);
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Spracherkennung wird in diesem Browser nicht unterstützt.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const t = e.results[e.results.length - 1][0].transcript;
      if (t) sendMessage(t);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    toast.info('Sprich jetzt – FYNIX hört zu.');
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-12 pb-3 border-b border-border bg-card/50">
        <button onClick={() => setScreen('home')} className="p-2 rounded-xl bg-background border border-border">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={MASCOT.smug} alt="FYNIX" className="w-9 h-9 rounded-full object-contain" />
          <div>
            <h1 className="font-display font-bold text-base">FYNIX</h1>
            <p className="text-xs text-muted-foreground">Lern-Assistent</p>
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setScreen('voice-call')}
            className="p-2 rounded-xl bg-primary text-primary-foreground flex items-center gap-2 font-display font-bold text-xs"
          >
            <Mic className="w-4 h-4" />
            Call
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground text-sm"
          >
            <p className="font-display font-bold text-foreground mb-2">Stell FYNIX was!</p>
            <p>Fragen zu Schulthemen, Erklärungen, Übungen – oder ruf mich per Mikro an.</p>
          </motion.div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <img src={MASCOT.smug} alt="" className="w-8 h-8 rounded-full shrink-0 object-contain" />
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
                  }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-3">
            <img src={MASCOT.thinking} alt="" className="w-8 h-8 rounded-full shrink-0 object-contain" />
            <div className="rounded-2xl px-4 py-2.5 bg-card border border-border text-sm text-muted-foreground">
              FYNIX denkt nach …
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-card/50">
        <div className="flex gap-2 items-end">
          <button
            onClick={startVoice}
            className={`p-3 rounded-xl border-2 shrink-0 ${listening ? 'border-red-500 bg-red-500/10' : 'border-border bg-background'}`}
            title="Mit FYNIX sprechen"
          >
            {listening ? <MicOff className="w-5 h-5 text-red-500" /> : <Mic className="w-5 h-5" />}
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Frag FYNIX …"
            className="flex-1 min-h-[44px] max-h-28 rounded-xl border border-border bg-background px-4 py-2.5 text-sm resize-none"
            rows={1}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-primary text-primary-foreground shrink-0 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <label className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={speakEnabled}
            onChange={e => setSpeakEnabled(e.target.checked)}
          />
          FYNIX antwortet vorlesen
        </label>
      </div>
    </div>
  );
}
