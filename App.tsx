import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from './AppContext';
import AppShell from './AppShell';

/** V1: Wendet Theme (Dark/Light) und Akzentfarbe auf das Dokument an – sofort app-weit */
function ThemeSync() {
  const { preferences } = useApp();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', preferences.theme === 'dark');
    root.classList.toggle('light', preferences.theme === 'light');
    root.setAttribute('data-accent', preferences.accent);
  }, [preferences.theme, preferences.accent]);
  return null;
}

function AppContent() {
  const { preferences } = useApp();
  const isDark = preferences.theme === 'dark';
  return (
    <>
      <ThemeSync />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: isDark ? 'oklch(0.18 0.025 280)' : 'oklch(0.98 0.01 280)',
            border: isDark ? '1px solid oklch(0.55 0.25 285 / 0.3)' : '1px solid oklch(0.2 0.02 280)',
            color: isDark ? 'oklch(0.92 0.01 280)' : 'oklch(0.15 0.02 280)',
            fontFamily: "'DM Sans', sans-serif",
          },
        }}
      />
      <AppShell />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
