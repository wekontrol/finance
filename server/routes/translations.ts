import { Router, Request, Response } from 'express';
import * as db from '../db/manager';
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
  try {
    const completeLanguages = getCompleteLanguages();
    res.json(completeLanguages);
  } catch (error: any) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Admin endpoint - get ALL languages with their completion status
router.get('/languages/all', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  try {
    const allLanguages = getAllLanguagesWithStatus();
    res.json(allLanguages);
  } catch (error: any) {
    console.error('Get all languages error:', error);
    res.status(500).json({ error: 'Failed to fetch all languages' });
  }
});

// Admin endpoint - validate a specific language
router.get('/validate/:language', requireTranslatorOrAdmin, (req: Request, res: Response) => {
  try {
    const { language } = req.params;
    const validation = validateLanguageCompleteness(language);
    res.json(validation);
  } catch (error: any) {
    console.error('Validate language error:', error);
    res.status(500).json({ error: 'Failed to validate language' });
  }
});

router.use(requireAuth);

// Get all translations for a language
router.get('/language/:language', async (req: Request, res: Response) => {
  try {
    const { language } = req.params;
    
    const translations = await db.all(`
      SELECT key, value FROM translations WHERE language = ? AND status = 'active'
      ORDER BY key
    `, [language]);

    const result: Record<string, string> = {};
    translations.forEach((t: any) => {
      result[t.key] = t.value;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Get translations error:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// Get all translation keys and languages (for translator editor)
router.get('/editor/all', requireTranslatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const translations = await db.all(`
      SELECT DISTINCT language, key, value, created_by, updated_at
      FROM translations
      WHERE status = 'active'
      ORDER BY language, key
    `);

    res.json(translations);
  } catch (error: any) {
    console.error('Get editor translations error:', error);
    res.status(500).json({ error: 'Failed to fetch editor translations' });
  }
});

// Save translation
router.post('/', requireTranslatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { language, key, value } = req.body;

    if (!language || !key || !value) {
      return res.status(400).json({ error: 'Language, key, and value are required' });
    }

    const id = `tr${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    await db.run(`
      INSERT OR REPLACE INTO translations (id, language, key, value, created_by, updated_at, status)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 'active')
    `, [id, language, key, value, userId]);

    res.status(201).json({ id, language, key, value });
  } catch (error: any) {
    console.error('Save translation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add new language
router.post('/language/add', requireTranslatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { language, baseLanguage } = req.body;
    const userId = req.session.userId;

    if (!language) {
      return res.status(400).json({ error: 'Language code is required' });
    }

    // If baseLanguage provided, copy translations from base
    if (baseLanguage) {
      const baseTranslations = await db.all(`
        SELECT key, value FROM translations WHERE language = ? AND status = 'active'
      `, [baseLanguage]);

      for (const t of baseTranslations) {
        const id = `tr${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        await db.run(`
          INSERT OR IGNORE INTO translations (id, language, key, value, created_by, status)
          VALUES (?, ?, ?, ?, ?, 'active')
        `, [id, language, t.key, t.value, userId]);
      }
    }

    // Validate the new language
    const validation = validateLanguageCompleteness(language);
    
    res.json({ 
      message: `Language ${language} added successfully`,
      validation
    });
  } catch (error: any) {
    console.error('Add language error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export translations as JSON
router.get('/export', requireTranslatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const translations = await db.all(`
      SELECT language, key, value FROM translations WHERE status = 'active' ORDER BY language, key
    `);

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
    console.error('Export translations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import translations from JSON
router.post('/import', requireTranslatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { language, translations: importedTranslations } = req.body;

    if (!language || !importedTranslations || typeof importedTranslations !== 'object') {
      return res.status(400).json({ error: 'Language and translations object are required' });
    }

    let count = 0;
    for (const [key, value] of Object.entries(importedTranslations)) {
      if (value && typeof value === 'string' && value.trim()) {
        const id = `tr${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        await db.run(`
          INSERT OR REPLACE INTO translations (id, language, key, value, created_by, updated_at, status)
          VALUES (?, ?, ?, ?, ?, datetime('now'), 'active')
        `, [id, language, key, value, userId]);
        count++;
      }
    }
    
    res.json({ message: `Imported ${count} translations for ${language}` });
  } catch (error: any) {
    console.error('Import translations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get statistics/completion percentage
router.get('/stats', requireTranslatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const languages = await db.all(`
      SELECT DISTINCT language FROM translations WHERE status = 'active'
    `) as any[];

    // Get total distinct keys
    const totalResult = await db.get(`
      SELECT COUNT(DISTINCT key) as count FROM translations WHERE status = 'active'
    `) as any;
    const totalKeys = totalResult?.count || 0;

    const stats = await Promise.all(languages.map(async (row: any) => {
      const lang = row.language;
      
      const translatedResult = await db.get(`
        SELECT COUNT(*) as count FROM translations 
        WHERE language = ? AND status = 'active' AND value IS NOT NULL AND value != ''
      `, [lang]) as any;
      const translated = translatedResult?.count || 0;

      return {
        language: lang,
        total: totalKeys,
        translated: translated,
        percentage: totalKeys ? Math.round((translated / totalKeys) * 100) : 0
      };
    }));

    res.json(stats);
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
