import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { getCompleteLanguages, getAllLanguagesWithStatus, validateLanguageCompleteness } from '../utils/validateLanguage';

const router = Router();

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireTranslatorOrAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.user || (req.session.user.role !== 'TRANSLATOR' && req.session.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Only translators and admins can access this' });
  }
  next();
}

// Public endpoint - get ONLY COMPLETE languages (no auth required)
router.get('/languages', (req: Request, res: Response) => {
  const completeLanguages = getCompleteLanguages();
  res.json(completeLanguages);
});

// Admin endpoint - get ALL languages with their completion status
router.get('/languages/all', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  const allLanguages = getAllLanguagesWithStatus();
  res.json(allLanguages);
});

// Admin endpoint - validate a specific language
router.get('/validate/:language', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  const { language } = req.params;
  const validation = validateLanguageCompleteness(language);
  res.json(validation);
});

router.use(requireAuth);

// Get all translations for a language
router.get('/language/:language', (req: Request, res: Response) => {
  const { language } = req.params;
  
  const translations = db.prepare(`
    SELECT key, value FROM translations WHERE language = ? AND status = 'active'
    ORDER BY key
  `).all(language);

  const result: Record<string, string> = {};
  translations.forEach((t: any) => {
    result[t.key] = t.value;
  });

  res.json(result);
});

// Get all translation keys and languages (for translator editor)
router.get('/editor/all', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  const translations = db.prepare(`
    SELECT DISTINCT language, key, value, created_by, updated_at
    FROM translations
    WHERE status = 'active'
    ORDER BY language, key
  `).all();

  res.json(translations);
});

// Save translation
router.post('/', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  const userId = req.session.userId;
  const { language, key, value } = req.body;

  if (!language || !key || !value) {
    return res.status(400).json({ error: 'Language, key, and value are required' });
  }

  const id = `tr${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  try {
    db.prepare(`
      INSERT OR REPLACE INTO translations (id, language, key, value, created_by, updated_at, status)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 'active')
    `).run(id, language, key, value, userId);

    res.status(201).json({ id, language, key, value });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add new language
router.post('/language/add', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  const { language, baseLanguage } = req.body;
  const userId = req.session.userId;

  if (!language) {
    return res.status(400).json({ error: 'Language code is required' });
  }

  // If baseLanguage provided, copy translations from base
  if (baseLanguage) {
    const baseTranslations = db.prepare(`
      SELECT key, value FROM translations WHERE language = ? AND status = 'active'
    `).all(baseLanguage);

    baseTranslations.forEach((t: any) => {
      const id = `tr${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT OR IGNORE INTO translations (id, language, key, value, created_by, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(id, language, t.key, t.value, userId);
    });
  }

  // Validate the new language
  const validation = validateLanguageCompleteness(language);
  
  res.json({ 
    message: `Language ${language} added successfully`,
    validation
  });
});

// Export translations as JSON
router.get('/export', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  try {
    const translations = db.prepare(`
      SELECT language, key, value FROM translations WHERE status = 'active' ORDER BY language, key
    `).all();

    const languages = [...new Set(translations.map((t: any) => t.language))];
    const allKeys = [...new Set(translations.map((t: any) => t.key))];
    
    const result: Record<string, Record<string, string>> = {};
    
    languages.forEach(lang => {
      result[lang] = {};
      allKeys.forEach(key => {
        const trans = translations.find((t: any) => t.language === lang && t.key === key);
        result[lang][key] = trans?.value || '';
      });
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Import translations from JSON
router.post('/import', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  const userId = req.session.userId;
  const { language, translations: importedTranslations } = req.body;

  if (!language || !importedTranslations || typeof importedTranslations !== 'object') {
    return res.status(400).json({ error: 'Language and translations object are required' });
  }

  try {
    let count = 0;
    for (const [key, value] of Object.entries(importedTranslations)) {
      if (value && typeof value === 'string' && value.trim()) {
        const id = `tr${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        db.prepare(`
          INSERT OR REPLACE INTO translations (id, language, key, value, created_by, updated_at, status)
          VALUES (?, ?, ?, ?, ?, datetime('now'), 'active')
        `).run(id, language, key, value, userId);
        count++;
      }
    }
    
    res.json({ message: `Imported ${count} translations for ${language}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics/completion percentage
router.get('/stats', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  try {
    const languages = db.prepare(`
      SELECT DISTINCT language FROM translations WHERE status = 'active'
    `).all() as any[];

    // Get total distinct keys
    const totalResult = db.prepare(`
      SELECT COUNT(DISTINCT key) as count FROM translations WHERE status = 'active'
    `).get() as any;
    const totalKeys = totalResult?.count || 0;

    const stats = languages.map((row: any) => {
      const lang = row.language;
      
      const translatedResult = db.prepare(`
        SELECT COUNT(*) as count FROM translations 
        WHERE language = ? AND status = 'active' AND value IS NOT NULL AND value != ''
      `).get(lang) as any;
      const translated = translatedResult?.count || 0;

      return {
        language: lang,
        total: totalKeys,
        translated: translated,
        percentage: totalKeys ? Math.round((translated / totalKeys) * 100) : 0
      };
    });

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
