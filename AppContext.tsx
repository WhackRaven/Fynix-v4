import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type AvatarKey, getStreakBonus, getLevelInfo, AVATARS, type MascotMood } from './assets';

// Types
export interface UserData {
  name: string;
  email: string;
  avatar: AvatarKey;
  xp: number;
  streak: number;
  sessions: number;
  lastActive: string;
  onboarded: boolean;
  grade: string;
  style: string;
  motivation: string;
  habits: string[];
  roastLevel: number;
  goal30: string;
  learnTime: string;
  schoolProblem: string;
  interests?: string;
  isPrivate: boolean;
}

export interface Habit {
  id: string;
  name: string;
  type: 'positive' | 'negative';
  xpValue: number;
  reps: number;
  completedToday: boolean;
  streak: number;
}

export interface MoneyEntry {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
  date: string;
}

export interface VocabEntry {
  id: string;
  term: string;
  translation: string;
  createdAt: string;
}

export interface VocabList {
  id: string;
  name: string;
  sourceLang: string;
  targetLang: string;
  entries: VocabEntry[];
  createdAt: string;
}

export interface SavedFact {
  id: string;
  category: string;
  title: string;
  content: string;
  savedAt: string;
}

/** App-weite Einstellungen: Dark/Light, Sprache, Akzentfarbe (V1-Erweiterung) */
export type ThemeMode = 'dark' | 'light';
export type AppLanguage = 'de' | 'en' | 'es';
export type AccentColor = 'yellow' | 'green' | 'blue' | 'purple' | 'red';

export interface AppPreferences {
  theme: ThemeMode;
  language: AppLanguage;
  accent: AccentColor;
  aiUrl: string;
}

interface AppState {
  user: UserData | null;
  screen: string;
  habits: Habit[];
  money: MoneyEntry[];
  jokers: number;
  chests: number;
  vocabLists: VocabList[];
  /** V1: Theme, Sprache, Akzentfarbe – sofort app-weit */
  preferences: AppPreferences;
  /** V2: Gespeicherte Fakten */
  savedFacts: SavedFact[];
}

interface AppContextType extends AppState {
  setScreen: (s: string) => void;
  login: (email: string, name: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
  updateUser: (data: Partial<UserData>) => void;
  addXP: (amount: number) => void;
  removeXP: (amount: number) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'completedToday' | 'streak'>) => void;
  completeHabit: (id: string) => void;
  removeHabit: (id: string) => void;
  addMoneyEntry: (entry: Omit<MoneyEntry, 'id'>) => void;
  removeMoneyEntry: (id: string) => void;
  useJoker: () => boolean;
  buyJoker: (cost: number) => boolean;
  openChest: () => string;
  addVocabList: (name: string, sourceLang: string, targetLang: string) => string;
  addVocabEntries: (listId: string, entries: Array<Omit<VocabEntry, 'id' | 'createdAt'>>) => void;
  addVocabEntry: (listId: string, entry: Omit<VocabEntry, 'id' | 'createdAt'>) => void;
  /** V1: Vokabel bearbeiten/löschen für Vokabelsammlung */
  removeVocabEntry: (listId: string, entryId: string) => void;
  updateVocabEntry: (listId: string, entryId: string, data: Partial<Pick<VocabEntry, 'term' | 'translation'>>) => void;
  getMascotMood: () => MascotMood;
  getRoast: () => string;
  addSavedFact: (fact: Omit<SavedFact, 'id' | 'savedAt'>) => void;
  removeSavedFact: (id: string) => void;
  /** V1: Einstellungen (Theme, Sprache, Akzent) */
  preferences: AppPreferences;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (lang: AppLanguage) => void;
  setAccent: (accent: AccentColor) => void;
  setAiUrl: (url: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_USER: UserData = {
  name: '',
  email: '',
  avatar: 'gamer',
  xp: 0,
  streak: 0,
  sessions: 0,
  lastActive: '',
  onboarded: false,
  grade: '',
  style: '',
  motivation: '',
  habits: [],
  roastLevel: 3,
  goal30: '',
  learnTime: '',
  schoolProblem: '',
  isPrivate: false,
};

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'dark',
  language: 'de',
  accent: 'purple',
  aiUrl: 'http://localhost:11434',
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem('fynix_state');
    if (saved) {
      const parsed = JSON.parse(saved) as AppState;
      if (parsed.user && typeof parsed.user.isPrivate === 'undefined') {
        parsed.user.isPrivate = false;
      }
      if (!parsed.vocabLists) {
        parsed.vocabLists = [];
      }
      if (!parsed.preferences) {
        parsed.preferences = { ...DEFAULT_PREFERENCES };
      }
      return parsed;
    }
  } catch { }
  return {
    user: null,
    screen: 'splash',
    habits: [],
    money: [],
    jokers: 3,
    chests: 0,
    vocabLists: [],
    preferences: { ...DEFAULT_PREFERENCES },
    savedFacts: [],
  };
}

function saveState(state: AppState) {
  localStorage.setItem('fynix_state', JSON.stringify(state));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Check streak on load
  useEffect(() => {
    if (state.user && state.user.onboarded) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (state.user.lastActive === yesterday) {
        setState(s => ({
          ...s,
          user: s.user ? { ...s.user, streak: (s.user.streak || 0) + 1, lastActive: today } : null,
          chests: s.chests + 1,
        }));
      } else if (state.user.lastActive !== today) {
        setState(s => ({
          ...s,
          user: s.user ? { ...s.user, streak: state.user!.lastActive ? 0 : 1, lastActive: today } : null,
        }));
      }
    }
  }, []);

  const setScreen = useCallback((screen: string) => {
    setState(s => ({ ...s, screen }));
  }, []);

  const login = useCallback((email: string, name: string) => {
    // Check if user exists
    const existing = localStorage.getItem('fynix_user_' + email);
    if (existing) {
      const userData = JSON.parse(existing) as UserData;
      const hydrated = { ...DEFAULT_USER, ...userData };
      setState(s => ({ ...s, user: hydrated, screen: hydrated.onboarded ? 'home' : 'onboarding' }));
    } else {
      const newUser = { ...DEFAULT_USER, email, name };
      localStorage.setItem('fynix_user_' + email, JSON.stringify(newUser));
      setState(s => ({ ...s, user: newUser, screen: 'onboarding' }));
    }
  }, []);

  const loginAsGuest = useCallback(() => {
    const guestId = 'guest_' + Date.now();
    const newUser = { ...DEFAULT_USER, email: guestId, name: 'Gast' };
    setState(s => ({ ...s, user: newUser, screen: 'onboarding' }));
  }, []);

  const logout = useCallback(() => {
    setState(s => ({ ...s, user: null, screen: 'splash', habits: [], money: [], jokers: 3, chests: 0 }));
  }, []);

  const updateUser = useCallback((data: Partial<UserData>) => {
    setState(s => {
      if (!s.user) return s;
      const updated = { ...s.user, ...data };
      if (updated.email && !updated.email.startsWith('guest_')) {
        localStorage.setItem('fynix_user_' + updated.email, JSON.stringify(updated));
      }
      return { ...s, user: updated };
    });
  }, []);

  const addXP = useCallback((amount: number) => {
    setState(s => {
      if (!s.user) return s;
      const bonus = getStreakBonus(s.user.streak);
      const total = Math.round(amount * (1 + bonus / 100));
      const updated = { ...s.user, xp: s.user.xp + total, sessions: s.user.sessions + 1, lastActive: new Date().toDateString() };
      if (updated.email && !updated.email.startsWith('guest_')) {
        localStorage.setItem('fynix_user_' + updated.email, JSON.stringify(updated));
      }
      return { ...s, user: updated };
    });
  }, []);

  const removeXP = useCallback((amount: number) => {
    setState(s => {
      if (!s.user) return s;
      const updated = { ...s.user, xp: Math.max(0, s.user.xp - amount) };
      if (updated.email && !updated.email.startsWith('guest_')) {
        localStorage.setItem('fynix_user_' + updated.email, JSON.stringify(updated));
      }
      return { ...s, user: updated };
    });
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'completedToday' | 'streak'>) => {
    setState(s => ({
      ...s,
      habits: [...s.habits, { ...habit, id: Date.now().toString(), completedToday: false, streak: 0 }],
    }));
  }, []);

  const completeHabit = useCallback((id: string) => {
    setState(s => ({
      ...s,
      habits: s.habits.map(h => h.id === id ? { ...h, completedToday: true, streak: h.streak + 1 } : h),
    }));
  }, []);

  const removeHabit = useCallback((id: string) => {
    setState(s => ({ ...s, habits: s.habits.filter(h => h.id !== id) }));
  }, []);

  const addMoneyEntry = useCallback((entry: Omit<MoneyEntry, 'id'>) => {
    setState(s => ({
      ...s,
      money: [...s.money, { ...entry, id: Date.now().toString() }],
    }));
  }, []);

  const removeMoneyEntry = useCallback((id: string) => {
    setState(s => ({ ...s, money: s.money.filter(m => m.id !== id) }));
  }, []);

  const addVocabList = useCallback((name: string, sourceLang: string, targetLang: string) => {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    setState(s => ({
      ...s,
      vocabLists: [...s.vocabLists, { id, name, sourceLang, targetLang, entries: [], createdAt }],
    }));
    return id;
  }, []);

  const addVocabEntries = useCallback((listId: string, entries: Array<Omit<VocabEntry, 'id' | 'createdAt'>>) => {
    setState(s => ({
      ...s,
      vocabLists: s.vocabLists.map(list => {
        if (list.id !== listId) return list;
        const next = entries.map(entry => ({
          ...entry,
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          createdAt: new Date().toISOString(),
        }));
        return { ...list, entries: [...list.entries, ...next] };
      }),
    }));
  }, []);

  const addVocabEntry = useCallback((listId: string, entry: Omit<VocabEntry, 'id' | 'createdAt'>) => {
    addVocabEntries(listId, [entry]);
  }, [addVocabEntries]);

  /** V1: Vokabel aus Liste entfernen (für Vokabelsammlung) */
  const removeVocabEntry = useCallback((listId: string, entryId: string) => {
    setState(s => ({
      ...s,
      vocabLists: s.vocabLists.map(list =>
        list.id !== listId ? list : { ...list, entries: list.entries.filter(e => e.id !== entryId) }
      ),
    }));
  }, []);

  /** V1: Vokabel bearbeiten (Begriff/Übersetzung) */
  const updateVocabEntry = useCallback((
    listId: string,
    entryId: string,
    data: Partial<Pick<VocabEntry, 'term' | 'translation'>>
  ) => {
    setState(s => ({
      ...s,
      vocabLists: s.vocabLists.map(list => {
        if (list.id !== listId) return list;
        return {
          ...list,
          entries: list.entries.map(e =>
            e.id !== entryId ? e : { ...e, ...data }
          ),
        };
      }),
    }));
  }, []);

  const useJoker = useCallback((): boolean => {
    let used = false;
    setState(s => {
      if (s.jokers > 0) {
        used = true;
        return { ...s, jokers: s.jokers - 1 };
      }
      return s;
    });
    return used;
  }, []);

  const buyJoker = useCallback((cost: number): boolean => {
    let bought = false;
    setState(s => {
      if (!s.user || s.user.xp < cost) return s;
      bought = true;
      return { ...s, jokers: s.jokers + 1, user: { ...s.user, xp: s.user.xp - cost } };
    });
    return bought;
  }, []);

  const openChest = useCallback((): string => {
    const rewards = [
      { label: '+50 XP Bonus!', type: 'xp', value: 50 },
      { label: '+100 XP Bonus!', type: 'xp', value: 100 },
      { label: 'Joker erhalten!', type: 'joker', value: 1 },
      { label: 'Mystischer Booster!', type: 'booster', value: 0 },
    ] as const;
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    setState(s => {
      if (s.chests > 0) {
        if (reward.type === 'xp' && s.user) {
          return { ...s, chests: s.chests - 1, user: { ...s.user, xp: s.user.xp + reward.value } };
        }
        if (reward.type === 'joker') {
          return { ...s, chests: s.chests - 1, jokers: s.jokers + 1 };
        }
        return { ...s, chests: s.chests - 1 };
      }
      return s;
    });
    return reward.label;
  }, []);

  const getMascotMood = useCallback((): MascotMood => {
    if (!state.user) return 'neutral';
    const lv = getLevelInfo(state.user.xp);
    if (state.user.streak >= 21) return 'throne';
    if (state.user.streak >= 14) return 'laughing';
    if (state.user.streak >= 7) return 'happy';
    if (state.user.sessions === 0) return 'sleepy';
    if (state.user.streak === 0 && state.user.sessions > 0) return 'crying';
    if (lv.level >= 10) return 'thinking';
    return 'smug';
  }, [state.user]);

  const getRoast = useCallback((): string => {
    const level = state.user?.roastLevel || 3;
    const roasts = {
      mild: [
        'Naja, knapp daneben ist auch vorbei 😅',
        'Fast! Aber fast zählt nur beim Hufeisen werfen 🐴',
        'Nicht schlimm, nächstes Mal klappt\'s! 💪',
      ],
      medium: [
        'Bruh... das war nicht dein bester Moment 💀',
        'Hast du geraten? Sei ehrlich 😤',
        'Mein Hamster hätte das gewusst 🐹',
      ],
      hard: [
        'Alter... ich bin sprachlos. Und das will was heißen 💀💀',
        'Hast du die Karte überhaupt gelesen?! 🤡',
        'Ich glaub du brauchst erstmal \'ne Pause... von allem 😭',
      ],
    };
    const pool = level <= 2 ? roasts.mild : level <= 3 ? roasts.medium : roasts.hard;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [state.user?.roastLevel]);

  /** V1: Theme umschalten (sofort app-weit) */
  const setTheme = useCallback((theme: ThemeMode) => {
    setState(s => ({ ...s, preferences: { ...s.preferences, theme } }));
  }, []);

  /** V1: Sprache umschalten (DE/EN/ES) */
  const setLanguage = useCallback((language: AppLanguage) => {
    setState(s => ({ ...s, preferences: { ...s.preferences, language } }));
  }, []);

  /** V1: Akzentfarbe (gelb/grün/blau/lila/rot) */
  const setAccent = useCallback((accent: AccentColor) => {
    setState(s => ({ ...s, preferences: { ...s.preferences, accent } }));
  }, []);

  /** V2: AI URL Setzen */
  const setAiUrl = useCallback((aiUrl: string) => {
    setState(s => ({ ...s, preferences: { ...s.preferences, aiUrl } }));
  }, []);

  /** V2: Gespeicherte Fakten */
  const addSavedFact = useCallback((fact: Omit<SavedFact, 'id' | 'savedAt'>) => {
    setState(s => ({
      ...s,
      savedFacts: [{ ...fact, id: Date.now().toString(), savedAt: new Date().toISOString() }, ...(s.savedFacts || [])],
    }));
  }, []);

  const removeSavedFact = useCallback((id: string) => {
    setState(s => ({ ...s, savedFacts: (s.savedFacts || []).filter(f => f.id !== id) }));
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      setScreen,
      login,
      loginAsGuest,
      logout,
      updateUser,
      addXP,
      removeXP,
      addHabit,
      completeHabit,
      removeHabit,
      addMoneyEntry,
      removeMoneyEntry,
      useJoker,
      buyJoker,
      openChest,
      addVocabList,
      addVocabEntries,
      addVocabEntry,
      removeVocabEntry,
      updateVocabEntry,
      getMascotMood,
      getRoast,
      addSavedFact,
      removeSavedFact,
      setTheme,
      setLanguage,
      setAccent,
      setAiUrl,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
