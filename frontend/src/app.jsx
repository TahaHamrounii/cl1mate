import 'src/global.css';

import { useEffect } from 'react';

import { usePathname } from 'src/routes/hooks';

import { LocalizationProvider } from 'src/locales';
import { themeConfig, ThemeProvider } from 'src/theme';
import { themeOverrides } from 'src/theme/theme-overrides';

import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/auth-context';

// ----------------------------------------------------------------------

export default function App({ children }) {
  useScrollToTop();

  return (
    <SettingsProvider defaultSettings={defaultSettings}>
      <LocalizationProvider>
        <ThemeProvider
          themeOverrides={themeOverrides}
          modeStorageKey={themeConfig.modeStorageKey}
          defaultMode={themeConfig.defaultMode}
        >
          <MotionLazy>
            <ProgressBar />
            <SettingsDrawer defaultSettings={defaultSettings} />
            <AuthProvider>
              {children}
            </AuthProvider>
          </MotionLazy>
        </ThemeProvider>
      </LocalizationProvider>
    </SettingsProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
