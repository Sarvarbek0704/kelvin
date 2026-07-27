import React from 'react';
import { useTranslation } from 'react-i18next';
import App from './App.jsx';

/**
 * Til almashtirilganda butun daraxtni qayta mount qiladi (key=til) — shunda
 * `label()` bilan render qilinadigan (useTranslation'ga obuna bo'lmagan)
 * komponentlar ham darhol yangi tilda chiqadi. React Query keshi issiq bo'lgani
 * uchun qayta yuklash bir zumda.
 */
function Root() {
  const { i18n } = useTranslation();
  return <App key={i18n.language} />;
}

export default Root;
