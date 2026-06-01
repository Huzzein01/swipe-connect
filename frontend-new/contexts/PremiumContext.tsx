import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PremiumContextType = {
  aiTailorEnabled: boolean;
  setAiTailorEnabled: (val: boolean) => Promise<void>;
};

const STORAGE_KEY = 'swipeconnect.premium';
const PremiumContext = createContext<PremiumContextType>({} as PremiumContextType);
export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aiTailorEnabled, setAiTailorState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) try { const s = JSON.parse(raw); setAiTailorState(s.aiTailorEnabled ?? false); } catch { /* ignore */ }
    });
  }, []);

  const setAiTailorEnabled = async (val: boolean) => {
    setAiTailorState(val);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ aiTailorEnabled: val }));
  };

  return (
    <PremiumContext.Provider value={{ aiTailorEnabled, setAiTailorEnabled }}>
      {children}
    </PremiumContext.Provider>
  );
};
