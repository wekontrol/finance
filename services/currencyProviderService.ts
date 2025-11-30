// Currency Provider Abstraction Layer
// Manages user preferences for currency conversion providers (BNA, FOREX, PARALLEL)

import { RateProvider } from '../types';

let cachedProvider: RateProvider | null = null;

export const getDefaultProvider = async (): Promise<RateProvider> => {
  if (cachedProvider) return cachedProvider;
  
  try {
    const response = await fetch('/api/settings/default-currency-provider', {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      cachedProvider = (data.provider || 'BNA') as RateProvider;
      return cachedProvider;
    }
  } catch (error) {
    console.error('Error getting default currency provider:', error);
  }
  
  return 'BNA';
};

export const setDefaultProvider = async (provider: RateProvider): Promise<void> => {
  try {
    const response = await fetch('/api/settings/default-currency-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider })
    });
    if (response.ok) {
      cachedProvider = provider;
    }
  } catch (error) {
    console.error('Error setting default currency provider:', error);
    throw error;
  }
};

export const clearCache = (): void => {
  cachedProvider = null;
};
