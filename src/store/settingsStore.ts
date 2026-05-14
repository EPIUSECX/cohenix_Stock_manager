import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface APISettings {
  baseUrl: string;
}

interface SettingsState {
  apiSettings: APISettings;
  setApiSettings: (settings: APISettings) => void;
  resetApiSettings: () => void;
}

const DEFAULT_SETTINGS: APISettings = {
  baseUrl: 'https://demo.cohenix.com',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiSettings: DEFAULT_SETTINGS,
      setApiSettings: (settings) => set({ apiSettings: settings }),
      resetApiSettings: () => set({ apiSettings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'cohenix-settings',
    }
  )
);
