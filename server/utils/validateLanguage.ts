import db from '../db/schema';

/**
 * Get all keys from the base language (Portuguese)
 */
export function getBaseLanguageKeys(): Set<string> {
  const baseTranslations = db.prepare(`
    SELECT DISTINCT key FROM translations WHERE language = 'pt' AND status = 'active'
  `).all();
  
  return new Set(baseTranslations.map((t: any) => t.key));
}

/**
 * Get all keys for a specific language
 */
export function getLanguageKeys(language: string): Set<string> {
  const translations = db.prepare(`
    SELECT DISTINCT key FROM translations WHERE language = ? AND status = 'active'
  `).all(language);
  
  return new Set(translations.map((t: any) => t.key));
}

/**
 * Validate that a language has all required keys
 * Returns: { isValid: boolean, missingKeys: string[], extraKeys: string[] }
 */
export function validateLanguageCompleteness(language: string) {
  const baseKeys = getBaseLanguageKeys();
  const languageKeys = getLanguageKeys(language);
  
  const missingKeys = Array.from(baseKeys).filter(key => !languageKeys.has(key));
  const extraKeys = Array.from(languageKeys).filter(key => !baseKeys.has(key));
  
  return {
    isValid: missingKeys.length === 0,
    totalRequired: baseKeys.size,
    totalHas: languageKeys.size,
    missingKeys,
    extraKeys,
    completionPercentage: baseKeys.size > 0 ? Math.round((languageKeys.size / baseKeys.size) * 100) : 0
  };
}

/**
 * Get languages that are complete (100% of keys)
 */
export function getCompleteLanguages(): string[] {
  const languages = db.prepare(`
    SELECT DISTINCT language FROM translations WHERE status = 'active' ORDER BY language
  `).all();
  
  const completeLanguages: string[] = [];
  
  languages.forEach((lang: any) => {
    const validation = validateLanguageCompleteness(lang.language);
    if (validation.isValid) {
      completeLanguages.push(lang.language);
    }
  });
  
  return completeLanguages;
}

/**
 * Get all languages with their completion status
 */
export function getAllLanguagesWithStatus(): Record<string, any> {
  const languages = db.prepare(`
    SELECT DISTINCT language FROM translations WHERE status = 'active' ORDER BY language
  `).all();
  
  const result: Record<string, any> = {};
  
  languages.forEach((lang: any) => {
    const validation = validateLanguageCompleteness(lang.language);
    result[lang.language] = {
      isComplete: validation.isValid,
      completionPercentage: validation.completionPercentage,
      totalKeys: validation.totalHas,
      totalRequired: validation.totalRequired,
      missingCount: validation.missingKeys.length
    };
  });
  
  return result;
}
