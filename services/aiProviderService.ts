// AI Provider Abstraction Layer
// Routes to the correct AI provider (Gemini, Puter, OpenRouter, or Groq)

import * as geminiService from './geminiService';
import * as puterService from './puterService';
import * as openrouterService from './openrouterService';
import * as groqService from './groqService';
import { settingsApi } from './api';
import { Transaction, UserBehaviorAnalysis, LoanSimulation } from '../types';

type AIProvider = 'google_gemini' | 'puter' | 'openrouter' | 'groq';

let cachedProvider: AIProvider | null = null;
let cachedFunctionProviders: Record<string, AIProvider> = {};

// Get default AI provider from server
export const getDefaultProvider = async (): Promise<AIProvider> => {
  if (cachedProvider) return cachedProvider;
  
  try {
    // Check all configs and find which one is marked as default
    const response = await fetch('/api/settings/default-ai-provider', {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      cachedProvider = data.provider || 'google_gemini';
      return cachedProvider;
    }
  } catch (error) {
    console.error('Error getting default provider:', error);
  }
  
  return 'google_gemini'; // fallback
};

// Get provider for specific function
export const getProviderForFunction = async (functionName: string): Promise<AIProvider> => {
  try {
    // Load all function providers if not cached
    if (Object.keys(cachedFunctionProviders).length === 0) {
      const response = await fetch('/api/settings/ai-function-providers', {
        credentials: 'include'
      });
      if (response.ok) {
        cachedFunctionProviders = await response.json();
      }
    }

    // Return specific function provider or default
    if (cachedFunctionProviders[functionName]) {
      return cachedFunctionProviders[functionName] as AIProvider;
    }
  } catch (error) {
    console.error(`Error getting provider for function ${functionName}:`, error);
  }

  // Fall back to default provider
  return await getDefaultProvider();
};

export const setDefaultProvider = async (provider: AIProvider): Promise<void> => {
  try {
    const response = await fetch('/api/settings/default-ai-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider })
    });
    if (response.ok) {
      cachedProvider = provider;
    }
  } catch (error) {
    console.error('Error setting default provider:', error);
    throw error;
  }
};

// Set provider for specific function
export const setProviderForFunction = async (functionName: string, provider: AIProvider): Promise<void> => {
  try {
    const response = await fetch('/api/settings/ai-function-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ functionName, provider })
    });
    if (response.ok) {
      cachedFunctionProviders[functionName] = provider;
    }
  } catch (error) {
    console.error(`Error setting provider for function ${functionName}:`, error);
    throw error;
  }
};

// Routes all AI services to the correct provider
export const categorizeTransaction = async (description: string, history: Transaction[] = []): Promise<string> => {
  const provider = await getProviderForFunction('categorize');
  
  if (provider === 'puter') {
    return puterService.categorizeTransactionWithPuter(description);
  } else if (provider === 'openrouter') {
    return openrouterService.categorizeTransactionWithOpenRouter(description);
  } else if (provider === 'groq') {
    return groqService.categorizeTransactionWithGroq(description);
  } else {
    return geminiService.categorizeTransaction(description, history);
  }
};

export const getFinancialAdvice = async (transactions: any[], goals: any[], language: string = 'pt'): Promise<string> => {
  const provider = await getProviderForFunction('financial_advice');
  
  if (provider === 'puter') {
    return puterService.getFinancialAdviceWithPuter(transactions, goals, language);
  } else if (provider === 'openrouter') {
    return openrouterService.getFinancialAdviceWithOpenRouter(transactions, goals, language);
  } else if (provider === 'groq') {
    return groqService.getFinancialAdviceWithGroq(transactions, goals, language);
  } else {
    return geminiService.getFinancialAdvice(transactions, goals, language);
  }
};

export const analyzeLoanDocument = async (text: string): Promise<Partial<LoanSimulation>> => {
  const provider = await getProviderForFunction('analyze_loan');
  
  if (provider === 'puter') {
    return puterService.analyzeLoanDocumentWithPuter(text);
  } else if (provider === 'openrouter') {
    return openrouterService.analyzeLoanDocumentWithOpenRouter(text);
  } else if (provider === 'groq') {
    return groqService.analyzeLoanDocumentWithGroq(text);
  } else {
    return geminiService.analyzeLoanDocument(text);
  }
};

export const analyzeUserBehavior = async (transactions: Transaction[], language: string = 'pt'): Promise<UserBehaviorAnalysis> => {
  const provider = await getProviderForFunction('analyze_behavior');
  
  if (provider === 'puter') {
    return puterService.analyzeUserBehaviorWithPuter(transactions, language);
  } else if (provider === 'openrouter') {
    return openrouterService.analyzeUserBehaviorWithOpenRouter(transactions, language);
  } else if (provider === 'groq') {
    return groqService.analyzeUserBehaviorWithGroq(transactions, language);
  } else {
    return geminiService.analyzeUserBehavior(transactions, language);
  }
};

export const parseTransactionFromText = async (text: string): Promise<Partial<Transaction>> => {
  const provider = await getProviderForFunction('parse_text');
  
  if (provider === 'puter') {
    return puterService.parseTransactionFromTextWithPuter(text);
  } else if (provider === 'openrouter') {
    return openrouterService.parseTransactionFromTextWithOpenRouter(text);
  } else if (provider === 'groq') {
    return groqService.parseTransactionFromTextWithGroq(text);
  } else {
    return geminiService.parseTransactionFromText(text);
  }
};

export const parseTransactionFromAudio = async (base64Audio: string): Promise<Partial<Transaction>> => {
  const provider = await getProviderForFunction('parse_audio');
  
  if (provider === 'puter') {
    return puterService.parseTransactionFromAudioWithPuter(base64Audio);
  } else if (provider === 'openrouter') {
    return openrouterService.parseTransactionFromAudioWithOpenRouter(base64Audio);
  } else if (provider === 'groq') {
    return groqService.parseTransactionFromAudioWithGroq(base64Audio);
  } else {
    return geminiService.parseTransactionFromAudio(base64Audio);
  }
};

export const suggestBudgets = async (transactions: Transaction[]): Promise<any[]> => {
  const provider = await getProviderForFunction('suggest_budgets');
  
  if (provider === 'puter') {
    return puterService.suggestBudgetsWithPuter(transactions);
  } else if (provider === 'openrouter') {
    return openrouterService.suggestBudgetsWithOpenRouter(transactions);
  } else if (provider === 'groq') {
    return groqService.suggestBudgetsWithGroq(transactions);
  } else {
    return geminiService.suggestBudgets(transactions);
  }
};

export const getAiChatResponse = async (message: string): Promise<string> => {
  const provider = await getProviderForFunction('chat');
  
  if (provider === 'puter') {
    return puterService.getAiChatResponseWithPuter(message);
  } else if (provider === 'openrouter') {
    return openrouterService.getAiChatResponseWithOpenRouter(message);
  } else if (provider === 'groq') {
    return groqService.getAiChatResponseWithGroq(message);
  } else {
    return geminiService.getAiChatResponse(message);
  }
};

export const getAiChatResponseStreaming = async (message: string): Promise<AsyncIterable<string>> => {
  const provider = await getProviderForFunction('chat_streaming');
  
  if (provider === 'puter') {
    return puterService.getAiChatResponseStreamingWithPuter(message);
  } else if (provider === 'openrouter') {
    return openrouterService.getAiChatResponseStreamingWithOpenRouter(message);
  } else if (provider === 'groq') {
    return groqService.getAiChatResponseStreamingWithGroq(message);
  } else {
    return geminiService.getAiChatResponseStreaming(message);
  }
};

export const parseTransactionFromReceipt = async (imageUrl: string): Promise<Partial<Transaction>> => {
  const provider = await getProviderForFunction('parse_receipt');
  
  if (provider === 'puter') {
    return puterService.parseTransactionFromReceiptWithPuter(imageUrl);
  } else if (provider === 'openrouter') {
    return openrouterService.parseTransactionFromReceiptWithOpenRouter(imageUrl);
  } else if (provider === 'groq') {
    return groqService.parseTransactionFromReceiptWithGroq(imageUrl);
  } else {
    return geminiService.parseTransactionFromReceipt(imageUrl);
  }
};

export const analyzeExpensesForWaste = async (transactions: Transaction[], language: string = 'pt'): Promise<{ wasteIndicators: string[], totalWaste: number, suggestions: string[] }> => {
  const provider = await getProviderForFunction('analyze_waste');
  
  if (provider === 'puter') {
    return puterService.analyzeExpensesForWasteWithPuter(transactions, language);
  } else if (provider === 'openrouter') {
    return openrouterService.analyzeExpensesForWasteWithOpenRouter(transactions, language);
  } else if (provider === 'groq') {
    return groqService.analyzeExpensesForWasteWithGroq(transactions, language);
  } else {
    return geminiService.analyzeExpensesForWaste(transactions, language);
  }
};
