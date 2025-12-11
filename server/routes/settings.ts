import { Router, Request, Response } from 'express';
import * as db from '../db/manager';

const router = Router();

// Get global settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await db.all(`SELECT * FROM app_settings`);
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current database selection
router.get('/database-choice', async (req: Request, res: Response) => {
  if (req.session?.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin only' });
  }

  try {
    const currentChoice = process.env.DATABASE_CHOICE || 'sqlite';
    const available = ['sqlite', 'postgresql'];
    
    res.json({
      currentChoice,
      availableChoices: available,
      pgConfigured: !!process.env.TheFinance || !!process.env.DATABASE_URL
    });
  } catch (error: any) {
    console.error('Error fetching database choice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update global settings
router.post('/', async (req: Request, res: Response) => {
  if (req.session?.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin only' });
  }

  const { key, value } = req.body;
  try {
    await db.run(`
      INSERT INTO app_settings (key, value) 
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `, [key, value]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notification config
router.get('/notification-config', (req: Request, res: Response) => {
  if (req.session?.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json({
    sendgridKeyExists: !!process.env.SENDGRID_API_KEY,
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || ''
  });
});

// Save notification config
router.post('/notification-config', (req: Request, res: Response) => {
  if (req.session?.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { sendgridKey, sendgridEmail } = req.body;
  
  // Save to env (for now just to process.env)
  if (sendgridKey && sendgridKey !== '••••••••••••••••') {
    process.env.SENDGRID_API_KEY = sendgridKey;
  }
  if (sendgridEmail) {
    process.env.SENDGRID_FROM_EMAIL = sendgridEmail;
  }

  res.json({ message: 'Configuration saved' });
});

// Get API configurations
router.get('/api-configs', async (req: Request, res: Response) => {
  console.log('[GET /api-configs] User role:', req.session?.user?.role);
  // Temporarily allow all for testing
  try {
    const configs = await db.all(`SELECT id, provider, model, created_at FROM api_configurations`);
    console.log('[GET /api-configs] Found configs:', configs);
    res.json(configs);
  } catch (error: any) {
    console.error('[GET /api-configs] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save or update API configuration
router.post('/api-configs', async (req: Request, res: Response) => {
  console.log('[POST /api-configs] Request body:', req.body);
  console.log('[POST /api-configs] User:', req.session?.user);
  
  try {
    const { id, provider, apiKey, model } = req.body;
    console.log('[POST /api-configs] Parsed:', { id, provider, model, hasKey: !!apiKey });

    if (id) {
      console.log('[POST /api-configs] Updating config:', id);
      await db.run(`UPDATE api_configurations SET api_key = ?, model = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [apiKey, model || null, id]);
      console.log('[POST /api-configs] Update successful');
    } else {
      // Check if provider already exists
      const existing = await db.get(`SELECT id FROM api_configurations WHERE provider = ?`, [provider]);
      
      if (existing) {
        // Update existing provider
        await db.run(`UPDATE api_configurations SET api_key = ?, model = ?, updated_at = CURRENT_TIMESTAMP WHERE provider = ?`, [apiKey, model || null, provider]);
        console.log('[POST /api-configs] Updated existing provider:', provider);
      } else {
        // Insert new
        const newId = `cfg_${Date.now()}`;
        console.log('[POST /api-configs] Inserting new config:', newId, 'provider:', provider);
        await db.run(`INSERT INTO api_configurations (id, provider, api_key, model) VALUES (?, ?, ?, ?)`, [newId, provider, apiKey, model || null]);
        console.log('[POST /api-configs] Insert successful');
      }
    }
    
    res.json({ success: true, message: 'API configuration saved' });
  } catch (error: any) {
    console.error('[POST /api-configs] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get API configuration value (for frontend to use)
router.get('/api-config/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    console.log('[GET /api-config] Provider:', provider);
    const config = await db.get(`SELECT api_key, model FROM api_configurations WHERE provider = ?`, [provider]);
    if (config) {
      console.log('[GET /api-config] Found config for', provider);
      res.json({ apiKey: config.api_key, model: config.model });
    } else {
      console.log('[GET /api-config] No config found for', provider);
      res.json({ apiKey: null, model: null });
    }
  } catch (error: any) {
    console.error('[GET /api-config] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete API configuration by ID
router.delete('/api-configs/:id', async (req: Request, res: Response) => {
  console.log('[DELETE /api-configs] ID:', req.params.id);
  // Temporarily allow all for testing
  const { id } = req.params;
  try {
    console.log('[DELETE /api-configs] Deleting:', id);
    await db.run(`DELETE FROM api_configurations WHERE id = ?`, [id]);
    console.log('[DELETE /api-configs] Delete successful');
    res.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api-configs] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete API configuration by provider
router.delete('/api-config/:provider', async (req: Request, res: Response) => {
  const { provider } = req.params;
  console.log('[DELETE /api-config/:provider] Provider:', provider);
  try {
    await db.run(`DELETE FROM api_configurations WHERE provider = ?`, [provider]);
    console.log('[DELETE /api-config/:provider] Deleted provider:', provider);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api-config/:provider] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get default AI provider
router.get('/default-ai-provider', async (req: Request, res: Response) => {
  try {
    const config = await db.get(`SELECT provider FROM api_configurations WHERE is_default = 1`);
    res.json({ provider: config?.provider || 'google_gemini' });
  } catch (error: any) {
    console.error('[GET /default-ai-provider] Error:', error);
    res.json({ provider: 'google_gemini' });
  }
});

// Set default AI provider
router.post('/default-ai-provider', async (req: Request, res: Response) => {
  const { provider } = req.body;
  console.log('[POST /default-ai-provider] Setting:', provider);
  try {
    // Unset all others
    await db.run(`UPDATE api_configurations SET is_default = 0`);
    // Set this one
    await db.run(`UPDATE api_configurations SET is_default = 1 WHERE provider = ?`, [provider]);
    console.log('[POST /default-ai-provider] Set successfully');
    res.json({ success: true });
  } catch (error: any) {
    console.error('[POST /default-ai-provider] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get default currency provider
router.get('/default-currency-provider', async (req: Request, res: Response) => {
  const userId = req.session?.userId;
  try {
    if (userId) {
      const user = await db.get(`SELECT currency_provider_preference FROM users WHERE id = ?`, [userId]);
      res.json({ provider: user?.currency_provider_preference || 'BNA' });
    } else {
      res.json({ provider: 'BNA' });
    }
  } catch (error: any) {
    console.error('[GET /default-currency-provider] Error:', error);
    res.json({ provider: 'BNA' });
  }
});

// Set default currency provider
router.post('/default-currency-provider', async (req: Request, res: Response) => {
  const userId = req.session?.userId;
  const { provider } = req.body;
  console.log('[POST /default-currency-provider] Setting:', provider, 'for user:', userId);
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (!['BNA', 'FOREX', 'PARALLEL', 'EXCHANGERATE_API', 'FAWAZ_AHMED'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  try {
    await db.run(`UPDATE users SET currency_provider_preference = ? WHERE id = ?`, [provider, userId]);
    console.log('[POST /default-currency-provider] Set successfully');
    res.json({ success: true, provider });
  } catch (error: any) {
    console.error('[POST /default-currency-provider] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fallback rates (used if API fails)
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  BNA: {
    AOA: 1,
    USD: 926.50,
    EUR: 1003.20,
    BRL: 188.10,
    GBP: 1168.00,
    CNY: 127.30,
    ZAR: 49.10,
    JPY: 6.35
  },
  FOREX: {
    AOA: 1,
    USD: 930.10,
    EUR: 1008.50,
    BRL: 189.50,
    GBP: 1175.20,
    CNY: 128.00,
    ZAR: 49.50,
    JPY: 6.40
  },
  PARALLEL: {
    AOA: 1,
    USD: 1150.00,
    EUR: 1240.00,
    BRL: 230.00,
    GBP: 1450.00,
    CNY: 160.00,
    ZAR: 60.00,
    JPY: 8.00
  }
};

// Get exchange rates for a specific provider - using live API
router.get('/rates/:provider', async (req: Request, res: Response) => {
  const { provider } = req.params;
  
  try {
    // Fetch live rates from free Fawaz Ahmed Currency API (supports AOA, no auth needed)
    const response = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    const usdRates = data.usd || {};

    // Convert USD rates to AOA base rates
    // AOA to USD rate is in usdRates.aoa, so 1 USD = X AOA
    // We need: 1 AOA = ? USD, EUR, etc
    const usdToAoa = usdRates.aoa || 912.50; // fallback if missing

    console.log('[GET /rates] Live rates fetched. USD->AOA:', usdToAoa);

    const liveRates = {
      AOA: 1,
      USD: 1 / usdToAoa, // How much USD is 1 AOA
      EUR: (usdRates.eur || 0.92) / usdToAoa,
      BRL: (usdRates.brl || 5.15) / usdToAoa,
      GBP: (usdRates.gbp || 0.79) / usdToAoa,
      CNY: (usdRates.cny || 7.25) / usdToAoa,
      ZAR: (usdRates.zar || 18.05) / usdToAoa,
      JPY: (usdRates.jpy || 153.50) / usdToAoa,
      lastUpdate: new Date().toISOString(),
      source: 'live'
    };

    return res.json(liveRates);
  } catch (error: any) {
    console.warn('[GET /rates] Live API failed, using fallback:', error.message);
    
    // Fallback to hardcoded rates
    try {
      const fallbackRates = FALLBACK_RATES[provider] || FALLBACK_RATES.BNA;
      console.log('[GET /rates] Using FALLBACK rates for provider:', provider);
      return res.json({
        ...fallbackRates,
        lastUpdate: new Date().toISOString(),
        source: 'fallback'
      });
    } catch (fallbackError: any) {
      console.error('[GET /rates] Error:', fallbackError);
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

export default router;
