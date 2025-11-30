// Groq AI Service - Comprehensive implementation of all 14 services
// Free, ultra-fast LLM inference (llama-3.3-70b, mixtral-8x7b-32768)

import Groq from 'groq-sdk';
import { Transaction, LoanSimulation, BudgetLimit, UserBehaviorAnalysis } from '../types';
import { settingsApi } from './api';

let cachedApiKey: string | null = null;

const languageNames: Record<string, string> = {
  pt: 'Portuguese',
  en: 'English',
  es: 'Spanish',
  um: 'Umbundu',
  ln: 'Lingala'
};

// Helper to retrieve the API key from server
const getApiKey = async () => {
  if (cachedApiKey) return cachedApiKey;
  
  try {
    const config = await settingsApi.getApiConfig('groq');
    if (config?.apiKey) {
      cachedApiKey = config.apiKey;
      return cachedApiKey;
    }
  } catch (error) {
    console.warn('Error getting Groq API key:', error);
  }
  
  return '';
};

// Helper to instantiate the client
const getGroqClient = async (): Promise<Groq | null> => {
  const apiKey = await getApiKey();
  if (!apiKey) return null;
  
  return new Groq({
    apiKey,
    dangerouslyAllowBrowser: true // Enable in browser environment
  });
};

// Export functions to manage the key
export const setGroqKey = async (key: string) => {
  try {
    await settingsApi.saveApiConfig('groq', key);
    cachedApiKey = key;
  } catch (error) {
    console.error('Erro ao salvar chave Groq:', error);
    throw error;
  }
};

export const hasGroqKey = async (): Promise<boolean> => {
  const key = await getApiKey();
  return !!key;
};

// 1. Categorize Transaction
export const categorizeTransactionWithGroq = async (description: string): Promise<string> => {
  const client = await getGroqClient();
  if (!client) {
    return 'Geral';
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Você é um assistente financeiro. Categorize a seguinte transação financeira em uma única palavra ou frase curta em Português (Ex: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Salário, Outros).
          
Descrição da transação: "${description}"

Responda apenas com a categoria.`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 50,
      temperature: 0.3
    });

    return response.choices[0]?.message?.content?.trim() || 'Geral';
  } catch (error) {
    console.error('Error categorizing with Groq:', error);
    return 'Geral';
  }
};

// 2. Financial Advice
export const getFinancialAdviceWithGroq = async (transactions: any[], goals: any[], language: string = 'pt'): Promise<string> => {
  const client = await getGroqClient();
  if (!client) {
    return 'Configure Groq em Configurações > Integrações para receber conselhos personalizados.';
  }

  try {
    const summary = JSON.stringify({
      totalTransacoes: transactions.length,
      metas: goals.map(g => ({ nome: g.name, progresso: (g.currentAmount / g.targetAmount).toFixed(2) }))
    });

    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Analise brevemente este resumo financeiro familiar e dê uma dica curta (máximo 2 frases) de como melhorar a saúde financeira.
Dados: ${summary}

IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}.`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 150,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content?.trim() || 'Mantenha o foco!';
  } catch (error) {
    console.error('Error getting financial advice from Groq:', error);
    return 'Mantenha o foco em suas metas de economia!';
  }
};

// 3. Analyze Loan Document
export const analyzeLoanDocumentWithGroq = async (text: string): Promise<Partial<LoanSimulation>> => {
  const client = await getGroqClient();
  if (!client) {
    return {};
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Analise o seguinte texto de documento de empréstimo e extraia as informações principais.
Retorne APENAS um JSON válido com: principal, taxaJuros, prazoMeses

Texto: ${text}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 200,
      temperature: 0.3
    });

    let jsonStr = response.choices[0]?.message?.content?.trim() || '{}';
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing loan document with Groq:', error);
    return {};
  }
};

// 4. Analyze User Behavior
export const analyzeUserBehaviorWithGroq = async (transactions: Transaction[], language: string = 'pt'): Promise<UserBehaviorAnalysis> => {
  const client = await getGroqClient();
  if (!client) {
    return { persona: 'Usuário', patternDescription: '', tip: '', nextMonthProjection: 0 };
  }

  try {
    const summary = JSON.stringify(transactions.slice(0, 10));

    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Analise o perfil de gastos do usuário baseado neste histórico de transações e retorne um JSON com:
{ "persona": "tipo de gasto", "patternDescription": "descrição", "tip": "conselho", "nextMonthProjection": número }

Transações: ${summary}

Responda APENAS em ${languageNames[language] || 'Portuguese'} e retorne APENAS JSON válido.`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 300,
      temperature: 0.5
    });

    let jsonStr = response.choices[0]?.message?.content?.trim() || '{}';
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing user behavior with Groq:', error);
    return { persona: 'Usuário', patternDescription: '', tip: '', nextMonthProjection: 0 };
  }
};

// 5. Parse Transaction from Text
export const parseTransactionFromTextWithGroq = async (text: string): Promise<Partial<Transaction>> => {
  const client = await getGroqClient();
  if (!client) {
    return { description: text, category: 'Geral' };
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Extraia dados de uma transação financeira do seguinte texto. Retorne APENAS um JSON com:
{ "description": "descrição", "amount": número, "type": "RECEITA" ou "DESPESA", "category": "Categoria", "date": "YYYY-MM-DD" }

Texto: "${text}"`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 200,
      temperature: 0.3
    });

    let jsonStr = response.choices[0]?.message?.content?.trim() || '{}';
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing transaction with Groq:', error);
    return { description: text, category: 'Geral' };
  }
};

// 6. Parse Transaction from Audio (Groq doesn't support speech-to-text)
export const parseTransactionFromAudioWithGroq = async (base64Audio: string): Promise<Partial<Transaction>> => {
  console.warn('Groq does not support audio transcription. Please use Gemini provider for audio features.');
  return { 
    description: '', 
    category: 'Geral',
    error: 'Groq não suporta processamento de áudio. Use Gemini para esta funcionalidade.'
  };
};

// 7. Suggest Budgets
export const suggestBudgetsWithGroq = async (transactions: Transaction[]): Promise<any[]> => {
  const client = await getGroqClient();
  if (!client) {
    return [];
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Com base no histórico de transações fornecido, sugira limites de orçamento por categoria.
Retorne APENAS um JSON válido com array de { categoria, limite }

Transações: ${JSON.stringify(transactions.slice(0, 20))}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 300,
      temperature: 0.5
    });

    let jsonStr = response.choices[0]?.message?.content?.trim() || '[]';
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error suggesting budgets with Groq:', error);
    return [];
  }
};

// 8. Chat Response
export const getAiChatResponseWithGroq = async (prompt: string): Promise<string> => {
  const client = await getGroqClient();
  if (!client) {
    return 'Configure Groq em Configurações para usar o assistente.';
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 1000,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'Sem resposta';
  } catch (error) {
    console.error('Error getting chat response from Groq:', error);
    return 'Erro ao processar a solicitação.';
  }
};

// 9. Chat Response Streaming
export const getAiChatResponseStreamingWithGroq = async (prompt: string, onChunk: (chunk: string) => void): Promise<void> => {
  const client = await getGroqClient();
  if (!client) {
    onChunk('Configure Groq em Configurações para usar o assistente.');
    return;
  }

  try {
    const stream = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 1000,
      temperature: 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        onChunk(chunk.choices[0].delta.content);
      }
    }
  } catch (error) {
    console.error('Error getting streaming response from Groq:', error);
    onChunk('Erro ao processar a solicitação.');
  }
};

// 10. Parse Transaction from Receipt
export const parseTransactionFromReceiptWithGroq = async (base64Image: string): Promise<Partial<Transaction>> => {
  // Groq doesn't support image processing - use for text extraction
  console.warn('Groq does not support image/receipt processing. Please use Gemini provider for receipts.');
  return { 
    description: '', 
    category: 'Geral',
    error: 'Groq não suporta processamento de imagens. Use Gemini para esta funcionalidade.'
  };
};

// 11. Analyze Expenses for Waste
export const analyzeExpensesForWasteWithGroq = async (transactions: Transaction[], language: string = 'pt'): Promise<string> => {
  const client = await getGroqClient();
  if (!client) {
    return 'Configure Groq em Configurações para análise de desperdícios.';
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Analise o histórico de transações e identifique desperdícios ou gastos duplicados. 
Forneça recomendações para economizar em ${languageNames[language] || 'Portuguese'}.

Transações: ${JSON.stringify(transactions.slice(0, 20))}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 400,
      temperature: 0.6
    });

    return response.choices[0]?.message?.content?.trim() || 'Nenhuma análise disponível';
  } catch (error) {
    console.error('Error analyzing waste with Groq:', error);
    return 'Erro na análise de desperdícios.';
  }
};

// 12. Predict Future Expenses
export const predictFutureExpensesWithGroq = async (transactions: Transaction[], language: string = 'pt'): Promise<string> => {
  const client = await getGroqClient();
  if (!client) {
    return 'Configure Groq em Configurações para previsões.';
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Com base no histórico de transações, preveja os gastos do próximo mês. 
Responda em ${languageNames[language] || 'Portuguese'} com categorias e valores aproximados.

Transações: ${JSON.stringify(transactions.slice(0, 20))}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 400,
      temperature: 0.6
    });

    return response.choices[0]?.message?.content?.trim() || 'Sem previsão disponível';
  } catch (error) {
    console.error('Error predicting expenses with Groq:', error);
    return 'Erro na previsão de despesas.';
  }
};

export default {
  categorizeTransactionWithGroq,
  getFinancialAdviceWithGroq,
  analyzeLoanDocumentWithGroq,
  analyzeUserBehaviorWithGroq,
  parseTransactionFromTextWithGroq,
  parseTransactionFromAudioWithGroq,
  suggestBudgetsWithGroq,
  getAiChatResponseWithGroq,
  getAiChatResponseStreamingWithGroq,
  parseTransactionFromReceiptWithGroq,
  analyzeExpensesForWasteWithGroq,
  predictFutureExpensesWithGroq,
  setGroqKey,
  hasGroqKey,
};
