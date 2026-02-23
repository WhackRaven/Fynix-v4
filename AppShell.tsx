import { useApp } from './AppContext';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from './SplashScreen';
import LoginScreen from './LoginScreen';
import OnboardingScreen from './OnboardingScreen';
import HomeScreen from './HomeScreen';
import FeedScreen from './FeedScreen';
import HabitScreen from './HabitScreen';
import MoneyScreen from './MoneyScreen';
import ProfileScreen from './ProfileScreen';
import QuizFromMaterialScreen from './QuizFromMaterialScreen';
import LernzettelScreen from './LernzettelScreen';
import FynixChatScreen from './FynixChatScreen';
import BottomNav from './BottomNav';
import SavedFactsScreen from './SavedFactsScreen';
import VoiceCallScreen from './VoiceCallScreen';
import VocabScreen from './VocabScreen';

const SCREENS_WITH_NAV = ['home', 'feed', 'habits', 'money', 'profile', 'vocab'];

export default function AppShell() {
  const { screen } = useApp();
  const showNav = SCREENS_WITH_NAV.includes(screen);

  const renderScreen = () => {
    switch (screen) {
      case 'splash': return <SplashScreen />;
      case 'login': return <LoginScreen />;
      case 'onboarding': return <OnboardingScreen />;
      case 'home': return <HomeScreen />;
      case 'feed': return <FeedScreen />;
      case 'habits': return <HabitScreen />;
      case 'money': return <MoneyScreen />;
      case 'profile': return <ProfileScreen />;
      case 'quiz-material': return <QuizFromMaterialScreen />;
      case 'lernzettel': return <LernzettelScreen />;
      case 'fynix-chat': return <FynixChatScreen />;
      case 'savedFacts': return <SavedFactsScreen />;
      case 'voice-call': return <VoiceCallScreen />;
      case 'vocab': return <VocabScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="phone-frame bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, oklch(0.55 0.25 285 / 0.15) 0%, transparent 70%)' }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-dvh"
          style={{ paddingBottom: showNav ? '90px' : '0' }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {showNav && <BottomNav />}
    </div>
  );
}
