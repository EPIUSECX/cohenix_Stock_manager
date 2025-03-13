import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface APISettings {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
}

interface SettingsState {
  apiSettings: APISettings;
  setApiSettings: (settings: APISettings) => void;
  resetApiSettings: () => void;
}

const DEFAULT_SETTINGS: APISettings = {
  baseUrl: "https://demo.cohenix.com",
  apiKey: "35682f719f81ab8",
  apiSecret: "21c9a852c73c6bc"
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