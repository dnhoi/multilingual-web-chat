import { createContext, useContext, useState } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'vi';
  });

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.vi?.[key] || translations.en?.[key] || key;
  };

  const changeLanguage = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem('app_language', language);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 