import { useState, useRef, useEffect } from 'react';
import { useApp } from './AppContext';
import { motion } from 'framer-motion';
import { PhoneOff, MicOff, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { chatWithAI } from './lib/ai';
import { MASCOT } from './assets';

const FYNIX_VOICE_SYSTEM = `Du bist FYNIX, ein cooler Assistent in einem Voice-Call.
Antworte auf Deutsch, extrem kurz (wie in einem normalen Gespräch) und ohne Formatierung. Erwähne keine Markdown-Zeichen.`;

export default function VoiceCallScreen() {
    const { setScreen, preferences } = useApp();
    const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
    const [fynixTalking, setFynixTalking] = useState(false);
    const [listening, setListening] = useState(false);
    const [muted, setMuted] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([
        { role: 'system', content: FYNIX_VOICE_SYSTEM }
    ]);

    useEffect(() => {
        // Simulate connection delay
        const timer = setTimeout(() => {
            setCallState('connected');
            greetAndListen();
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const greetAndListen = async () => {
        // Initial greeting
        setFynixTalking(true);
        await speak("Hey! Was gibt's?");
        startListening();
    };

    const speak = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                setFynixTalking(false);
                resolve();
                return;
            }
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'de-DE';
            u.rate = 1.0;
            u.onend = () => {
                setFynixTalking(false);
                resolve();
            };
            u.onerror = () => {
                setFynixTalking(false);
                resolve();
            };
            window.speechSynthesis.speak(u);
        });
    };

    const processUserInput = async (text: string) => {
        if (callState === 'ended') return;
        setListening(false);
        setFynixTalking(true);

        const nextHistory = [...chatHistory, { role: 'user', content: text }];
        setChatHistory(nextHistory);

        try {
            const reply = await chatWithAI(preferences.aiUrl, nextHistory, text);
            if (reply.success) {
                setChatHistory([...nextHistory, { role: 'assistant', content: reply.text }]);
                await speak(reply.text);
            } else {
                await speak("Verbindungsprobleme. Sag das bitte nochmal.");
            }
        } catch {
            await speak("Entschuldige, ich bin gerade offline.");
        }

        startListening();
    };

    const startListening = () => {
        if (muted || callState === 'ended') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Spacherkennung im Browser nicht verfügbar.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setListening(true);
        recognition.onresult = (e: any) => {
            const t = e.results[e.results.length - 1][0].transcript;
            if (t) processUserInput(t);
        };
        recognition.onend = () => {
            if (!fynixTalking && callState === 'connected') {
                // Restart listening if we stopped but Fynix isn't talking
                setListening(false);
                setTimeout(startListening, 500);
            }
        };
        recognition.onerror = () => {
            setListening(false);
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch { }
    };

    const handleEndCall = () => {
        setCallState('ended');
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
        }
        window.speechSynthesis.cancel();
        setScreen('home');
    };

    return (
        <div className="bg-black text-white h-dvh w-full relative overflow-hidden flex flex-col justify-between pt-16 pb-12">
            <div className="text-center z-10">
                <h2 className="text-3xl font-display font-extrabold mb-2">FYNIX</h2>
                <p className="text-white/60 font-medium">
                    {callState === 'connecting' ? 'Verbindet...' : callState === 'ended' ? 'Anruf beendet' : listening ? 'Hört zu...' : 'Spricht...'}
                </p>
            </div>

            <div className="flex-1 flex items-center justify-center relative z-10 my-8">
                <motion.div
                    animate={
                        fynixTalking
                            ? { scale: [1, 1.15, 1], rotate: [-2, 2, -2] }
                            : listening ? { scale: [1, 1.05, 1] } : { scale: 1 }
                    }
                    transition={
                        fynixTalking
                            ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                            : listening ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } : { duration: 0.5 }
                    }
                    className="relative"
                >
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150 pointer-events-none" />
                    <img
                        src={callState === 'connecting' ? MASCOT.thinking : fynixTalking ? MASCOT.happy : MASCOT.smug}
                        alt="FYNIX Caller ID"
                        className="w-48 h-48 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    />
                </motion.div>
            </div>

            <div className="flex justify-center items-center gap-8 z-10 px-8">
                <button
                    onClick={() => {
                        setMuted(!muted);
                        if (!muted && recognitionRef.current) {
                            try { recognitionRef.current.stop(); } catch { }
                            setListening(false);
                        } else if (muted && !fynixTalking) {
                            startListening();
                        }
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${muted ? 'bg-white text-black' : 'bg-white/20 text-white backdrop-blur-md'}`}
                >
                    {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button
                    onClick={handleEndCall}
                    className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                >
                    <PhoneOff className="w-8 h-8 text-white" />
                </button>
            </div>
        </div >
    );
}
