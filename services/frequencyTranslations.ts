/**
 * Frequency translations for multiple languages
 * Maps between English keys and localized labels
 */

type LanguageCode = 'pt' | 'es' | 'um' | 'en';

export const frequencyTranslations: Record<LanguageCode, Record<string, string>> = {
  pt: {
    'weekly': 'Semanal',
    'biweekly': 'Quinzenal',
    'monthly': 'Mensal',
    'quarterly': 'Trimestral',
    'semiannual': 'Semestral',
    'yearly': 'Anual'
  },
  es: {
    'weekly': 'Semanal',
    'biweekly': 'Quincenal',
    'monthly': 'Mensual',
    'quarterly': 'Trimestral',
    'semiannual': 'Semestral',
    'yearly': 'Anual'
  },
  um: {
    'weekly': 'Lingana',
    'biweekly': 'Lingana ya mavali',
    'monthly': 'Lingilá',
    'quarterly': 'Lingilá ya kuna',
    'semiannual': 'Lingilá ya sitanu',
    'yearly': 'Angelu'
  },
  en: {
    'weekly': 'Weekly',
    'biweekly': 'Biweekly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'semiannual': 'Semiannual',
    'yearly': 'Yearly'
  }
};

/**
 * Reverse mapping: from localized label to English key
 * Used for parsing Excel imports
 */
export const frequencyFromLabel: Record<LanguageCode, Record<string, string>> = {
  pt: {
    'semanal': 'weekly',
    'lingana': 'weekly',
    'quinzenal': 'biweekly',
    'quincenal': 'biweekly',
    'mensal': 'monthly',
    'lingilá': 'monthly',
    'trimestral': 'quarterly',
    'semestral': 'semiannual',
    'anual': 'yearly',
    'angelu': 'yearly',
    // Also accept English
    'weekly': 'weekly',
    'biweekly': 'biweekly',
    'monthly': 'monthly',
    'quarterly': 'quarterly',
    'semiannual': 'semiannual',
    'yearly': 'yearly'
  },
  es: {
    'semanal': 'weekly',
    'quincenal': 'biweekly',
    'mensual': 'monthly',
    'trimestral': 'quarterly',
    'semestral': 'semiannual',
    'anual': 'yearly',
    // Also accept English
    'weekly': 'weekly',
    'biweekly': 'biweekly',
    'monthly': 'monthly',
    'quarterly': 'quarterly',
    'semiannual': 'semiannual',
    'yearly': 'yearly'
  },
  um: {
    'lingana': 'weekly',
    'lingana ya mavali': 'biweekly',
    'lingilá': 'monthly',
    'lingilá ya kuna': 'quarterly',
    'lingilá ya sitanu': 'semiannual',
    'angelu': 'yearly',
    // Also accept English
    'weekly': 'weekly',
    'biweekly': 'biweekly',
    'monthly': 'monthly',
    'quarterly': 'quarterly',
    'semiannual': 'semiannual',
    'yearly': 'yearly'
  },
  en: {
    'weekly': 'weekly',
    'biweekly': 'biweekly',
    'monthly': 'monthly',
    'quarterly': 'quarterly',
    'semiannual': 'semiannual',
    'yearly': 'yearly'
  }
};

/**
 * Get frequency label in specified language
 */
export const getFrequencyLabel = (frequency: string, language: LanguageCode = 'pt'): string => {
  return frequencyTranslations[language]?.[frequency] || frequency;
};

/**
 * Parse frequency from user input (in any language)
 */
export const parseFrequencyFromLabel = (label: string, language: LanguageCode = 'pt'): string => {
  const normalized = label.toLowerCase().trim();
  const mapping = frequencyFromLabel[language] || frequencyFromLabel['en'];
  return mapping[normalized] || normalized;
};

/**
 * Get all frequency options for a language
 */
export const getFrequencyOptions = (language: LanguageCode = 'pt') => {
  return Object.entries(frequencyTranslations[language] || frequencyTranslations['pt']).map(
    ([key, label]) => ({ key, label })
  );
};
