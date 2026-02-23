// Fynix Asset CDN URLs
// Design: "Enchanted Scroll" – Mystischer Wald trifft Mobile Gaming
// Fonts: Syne (display), DM Sans (body)
// Palette: Midnight Blue base, Amethyst primary, Moonlight Silver text

export const MASCOT = {
  angry: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/SFakockcNGiWonaJ.png',
  sleepy: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/ssctjsZxAMsVKiju.png',
  happy: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/DesPcmPEPjcbVQNX.png',
  smug: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/zfaUggItjdfxGgZR.png',
  crying: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/PcqUdiSizzYkUPUE.png',
  neutral: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/zfaUggItjdfxGgZR.png',
  laughing: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/DesPcmPEPjcbVQNX.png',
  thinking: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/zfaUggItjdfxGgZR.png',
  throne: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/DesPcmPEPjcbVQNX.png',
} as const;

export const ICONS = {
  streak: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/zKunnzghrchlZoKX.png',
  xp: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/QStBLbOzjhGItdcR.png',
} as const;

export const AVATARS = {
  headband: {
    src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/QEirWJurltuInfhw.png',
    name: 'Sporty',
  },
  hoodie_girl: {
    src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/jwkMvONGyMySagKF.png',
    name: 'Chill Girl',
  },
  skull: {
    src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/UzzxddjSEDZJOpVT.png',
    name: 'Rebel',
  },
  glasses: {
    src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/TwGsMMqjxaqvWmVi.png',
    name: 'Nerd',
  },
  artist: {
    src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/uJHjQHNhTlRgoSEV.png',
    name: 'Artist',
  },
  cap: {
    src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/ORLrMiPslQCAbRNa.png',
    name: 'Skater',
  },
  gamer: {
    src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/bHdMzuYCRAxaVuYt.png',
    name: 'Gamer',
  },
  star_girl: {
    src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/NjqpECvZuEomCHxY.png',
    name: 'Star',
  },
  chain_boy: {
    src: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663372553377/OVJeXQjCsMJGgKnN.png',
    name: 'Boss',
  },
} as const;

export type AvatarKey = keyof typeof AVATARS;
export type MascotMood = keyof typeof MASCOT;

// XP Level System
export const LEVEL_TITLES = ['Newbie', 'Scholar', 'Learner', 'Explorer', 'Thinker', 'Achiever', 'Master', 'Expert', 'Legend', 'Champion', 'GOD'];

export function getLevelInfo(xp: number) {
  const xpForLevel = (lvl: number) => {
    if (lvl <= 5) return 50 + Math.floor(lvl) * 50;
    if (lvl <= 15) return 300 + Math.floor(lvl - 5) * 100;
    if (lvl <= 40) return 1300 + Math.floor(lvl - 15) * 200;
    return 6300 + Math.floor(lvl - 40) * 500;
  };

  let level = 1;
  let curThresh = 0;
  let nextThresh = xpForLevel(1);
  while (xp >= nextThresh && level < 200) {
    level += 1;
    curThresh = nextThresh;
    nextThresh = curThresh + xpForLevel(level);
  }
  const pct = Math.min(100, Math.max(0, Math.round(((xp - curThresh) / (nextThresh - curThresh)) * 100)));
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  return { level, title, pct, curThresh, nextThresh };
}

// Streak Bonus
export function getStreakBonus(streak: number): number {
  if (streak >= 21) return 50;
  if (streak >= 14) return 10;
  if (streak >= 7) return 5;
  return 0;
}

// Feed Content
export const FEED_CARDS = [
  {
    id: '1',
    category: 'Mathe',
    title: 'Prozentrechnung leicht gemacht',
    content: '10% von 250 = 25. Einfach die Zahl durch 10 teilen! Für 20% verdoppelst du das Ergebnis. Für 5% halbierst du die 10%.',
    color: 'from-violet-600/20 to-indigo-600/20',
    quiz: { question: 'Was sind 15% von 200?', options: ['25', '30', '35', '40'], correct: 1, type: 'mc' as const },
  },
  {
    id: '2',
    category: 'Englisch',
    title: 'Irregular Verbs – Die Top 5',
    content: 'go → went → gone\ndo → did → done\nsee → saw → seen\ntake → took → taken\nget → got → gotten',
    color: 'from-blue-600/20 to-cyan-600/20',
    quiz: { question: 'Was ist die Past-Form von "see"?', options: ['seed', 'saw', 'seen', 'sawed'], correct: 1, type: 'mc' as const },
  },
  {
    id: '3',
    category: 'Biologie',
    title: 'Fotosynthese in 10 Sekunden',
    content: 'Pflanzen nehmen CO₂ + Wasser + Licht → produzieren Sauerstoff + Glucose. Ohne Fotosynthese: kein Sauerstoff, kein Leben!',
    color: 'from-emerald-600/20 to-green-600/20',
    quiz: { question: 'Was produzieren Pflanzen bei der Fotosynthese?', options: ['CO₂ + Wasser', 'O₂ + Glucose', 'Nur Sauerstoff', 'Nur Glucose'], correct: 1, type: 'mc' as const },
  },
  {
    id: '3a',
    category: 'Bio Quick',
    title: 'True/False: Atmung',
    content: 'Der menschliche Körper braucht Sauerstoff, um Energie zu produzieren. Ohne O₂ geht der Akku schnell leer.',
    color: 'from-emerald-600/20 to-green-600/20',
    quiz: { question: 'Der Körper kann dauerhaft ohne Sauerstoff Energie erzeugen.', options: ['True', 'False'], correct: 1, type: 'tf' as const },
  },
  {
    id: '4',
    category: 'Geschichte',
    title: 'Französische Revolution',
    content: '1789: Sturm auf die Bastille. Das Volk hatte genug von Hunger und Ungerechtigkeit. Motto: Freiheit, Gleichheit, Brüderlichkeit!',
    color: 'from-amber-600/20 to-orange-600/20',
    quiz: { question: 'Wann war der Sturm auf die Bastille?', options: ['1776', '1789', '1804', '1815'], correct: 1, type: 'mc' as const },
  },
  {
    id: '5',
    category: 'Physik',
    title: 'Geschwindigkeit berechnen',
    content: 'v = s / t (Geschwindigkeit = Strecke / Zeit). Ein Auto fährt 100 km in 2 Stunden → v = 100/2 = 50 km/h. Easy!',
    color: 'from-rose-600/20 to-pink-600/20',
    quiz: { question: 'Ein Zug fährt 300 km in 3 Stunden. Wie schnell?', options: ['90 km/h', '100 km/h', '150 km/h', '200 km/h'], correct: 1, type: 'mc' as const },
  },
  {
    id: '6',
    category: 'Deutsch',
    title: 'Konjunktiv II – Wünsche',
    content: 'Wenn ich reich wäre, würde ich reisen. "wäre" und "würde" = Konjunktiv II. Drückt irreale Wünsche und Bedingungen aus.',
    color: 'from-purple-600/20 to-fuchsia-600/20',
    quiz: { question: 'Welcher Satz nutzt Konjunktiv II korrekt?', options: ['Ich bin reich', 'Ich wäre gern reich', 'Ich war reich', 'Ich werde reich'], correct: 1, type: 'mc' as const },
  },
  {
    id: '6a',
    category: 'Deutsch Quick',
    title: 'True/False: Satzbau',
    content: 'Im Deutschen steht das Verb im Aussagesatz meistens an zweiter Stelle.',
    color: 'from-purple-600/20 to-fuchsia-600/20',
    quiz: { question: 'Im Aussagesatz steht das Verb an zweiter Stelle.', options: ['True', 'False'], correct: 0, type: 'tf' as const },
  },
  {
    id: '7',
    category: 'Chemie',
    title: 'Periodensystem Basics',
    content: 'H = Wasserstoff, O = Sauerstoff, C = Kohlenstoff, N = Stickstoff. H₂O = Wasser (2x Wasserstoff + 1x Sauerstoff).',
    color: 'from-teal-600/20 to-emerald-600/20',
    quiz: { question: 'Woraus besteht Wasser (H₂O)?', options: ['2x Sauerstoff + 1x Wasserstoff', '2x Wasserstoff + 1x Sauerstoff', '1x Wasserstoff + 1x Sauerstoff', '3x Wasserstoff'], correct: 1, type: 'mc' as const },
  },
  {
    id: '8',
    category: 'Money',
    title: 'Zinseszins-Effekt',
    content: '100€ mit 5% Zinsen: Nach 1 Jahr = 105€. Nach 2 Jahren = 110,25€. Nach 10 Jahren = 162,89€. Dein Geld arbeitet für dich!',
    color: 'from-yellow-600/20 to-amber-600/20',
    quiz: { question: 'Was passiert beim Zinseszins?', options: ['Zinsen bleiben gleich', 'Zinsen werden auf Zinsen berechnet', 'Geld verliert Wert', 'Nichts'], correct: 1, type: 'mc' as const },
  },
];

// Roast Messages
export const ROASTS = {
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
