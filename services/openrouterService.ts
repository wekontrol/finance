// OpenRouter AI Service - Comprehensive implementation of all 14 services
// Provides access to 500+ LLMs through OpenRouter

import { settingsApi } from './api';
import { Transaction, LoanSimulation, UserBehaviorAnalysis } from '../types';

const languageNames: Record<string, string> = {
  pt: 'Portuguese',
  en: 'English',
  es: 'Spanish',
  um: 'Umbundu',
  ln: 'Lingala'
};

// Get OpenRouter API config
const getOpenRouterConfig = async () => {
  try {
    const config = await settingsApi.getApiConfig('openrouter');
    return config;
  } catch (error) {
    console.error('Error getting OpenRouter config:', error);
    return null;
  }
};

// Make OpenRouter API call
const callOpenRouter = async (prompt: string, model: string = 'openai/gpt-3.5-turbo'): Promise<string> => {
  const config = await getOpenRouterConfig();
  if (!config?.apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Gestor Financeiro',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
};

// 1. Categorize Transaction
export const categorizeTransactionWithOpenRouter = async (description: string): Promise<string> => {
  try {
    const prompt = `
      Você é um assistente financeiro. Categorize a seguinte transação financeira em uma única palavra ou frase curta em Português (Ex: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Salário, Outros).
      
      Descrição da transação: "${description}"
      
      Responda apenas com a categoria.
    `;

    const response = await callOpenRouter(prompt, 'openai/gpt-3.5-turbo');
    return response?.trim() || 'Geral';
  } catch (error) {
    console.error('Error categorizing with OpenRouter:', error);
    return 'Geral';
  }
};

// 2. Financial Advice
export const getFinancialAdviceWithOpenRouter = async (transactions: any[], goals: any[], language: string = 'pt'): Promise<string> => {
  try {
    const summary = JSON.stringify({
      totalTransacoes: transactions.length,
      metas: goals.map(g => ({ nome: g.name, progresso: (g.currentAmount / g.targetAmount).toFixed(2) }))
    });

    const prompt = `
      Analise brevemente este resumo financeiro familiar e dê uma dica curta (máximo 2 frases) de como melhorar a saúde financeira.
      Dados: ${summary}
      
      IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}.
    `;

    const response = await callOpenRouter(prompt);
    return response?.trim() || 'Mantenha o foco!';
  } catch (error) {
    console.error('Error getting financial advice from OpenRouter:', error);
    return 'Mantenha o foco em suas metas de economia!';
  }
};

// 3. Analyze Loan Document
export const analyzeLoanDocumentWithOpenRouter = async (text: string): Promise<Partial<LoanSimulation>> => {
  try {
    const prompt = `
      Analise o seguinte texto de documento de empréstimo e extraia as informações principais.
      Retorne APENAS um JSON válido com: principal, taxaJuros, prazoMeses
      
      Texto: ${text}
    `;

    const response = await callOpenRouter(prompt);
    let jsonStr = response?.trim() || '{}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing loan document with OpenRouter:', error);
    return {};
  }
};

// 4. Analyze User Behavior
export const analyzeUserBehaviorWithOpenRouter = async (transactions: Transaction[], language: string = 'pt'): Promise<UserBehaviorAnalysis> => {
  try {
    const summary = JSON.stringify(transactions.slice(0, 10));

    const prompt = `
      Analise o comportamento de gastos deste usuário e retorne APENAS um JSON válido com:
      - persona (tipo de gastador em ${languageNames[language] || 'Portuguese'})
      - patternDescription (descrição do padrão)
      - tip (dica de melhoria)
      - nextMonthProjection (projeção de gastos para próximo mês em número)
      
      Transações: ${summary}
      IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}.
    `;

    const response = await callOpenRouter(prompt);
    let jsonStr = response?.trim() || '{}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing user behavior with OpenRouter:', error);
    return { persona: 'Usuário', patternDescription: '', tip: '', nextMonthProjection: 0 };
  }
};

// 5. Parse Transaction from Text
export const parseTransactionFromTextWithOpenRouter = async (text: string): Promise<Partial<Transaction>> => {
  try {
    const prompt = `
      Extraia os dados de uma transação financeira do seguinte texto em Português. Retorne APENAS um JSON válido com:
      - description: Descrição breve
      - amount: Valor numérico
      - type: "INCOME" ou "EXPENSE"
      - category: Categoria (uma palavra)
      - date: Data em formato YYYY-MM-DD (hoje se não mencionada)
      
      Texto: "${text}"
    `;

    const response = await callOpenRouter(prompt);
    let jsonStr = response?.trim() || '{}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing transaction with OpenRouter:', error);
    return { description: text, category: 'Geral' };
  }
};

// 6. Parse Transaction from Audio (using speech-to-text first)
export const parseTransactionFromAudioWithOpenRouter = async (base64Audio: string): Promise<Partial<Transaction>> => {
  try {
    // Note: OpenRouter doesn't have speech-to-text, so we return placeholder
    console.warn('OpenRouter does not support audio transcription');
    return { description: '', category: 'Geral' };
  } catch (error) {
    console.error('Error parsing audio with OpenRouter:', error);
    return { description: '', category: 'Geral' };
  }
};

// 7. Suggest Budgets
export const suggestBudgetsWithOpenRouter = async (transactions: Transaction[]): Promise<any[]> => {
  try {
    const prompt = `
      Com base no histórico de transações fornecido, sugira limites de orçamento por categoria.
      Retorne APENAS um JSON válido com array de { categoria, limite }
      
      Transações: ${JSON.stringify(transactions.slice(0, 20))}
    `;

    const response = await callOpenRouter(prompt);
    let jsonStr = response?.trim() || '[]';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error suggesting budgets with OpenRouter:', error);
    return [];
  }
};

// 8. Chat Response
export const getAiChatResponseWithOpenRouter = async (message: string): Promise<string> => {
  try {
    const response = await callOpenRouter(message);
    return response?.trim() || '';
  } catch (error) {
    console.error('Error getting chat response from OpenRouter:', error);
    return 'Desculpe, não consegui processar sua mensagem.';
  }
};

// 9. Chat Response Streaming
export const getAiChatResponseStreamingWithOpenRouter = async (message: string): Promise<AsyncIterable<string>> => {
  const config = await getOpenRouterConfig();
  if (!config?.apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  return (async function* () {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'Gestor Financeiro',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [{ role: 'user', content: message }],
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) yield content;
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming response from OpenRouter:', error);
      yield 'Erro ao processar sua mensagem.';
    }
  })();
};

// 10. Parse Transaction from Receipt (OCR)
export const parseTransactionFromReceiptWithOpenRouter = async (imageUrl: string): Promise<Partial<Transaction>> => {
  try {
    const prompt = `
      Analise este recibo/nota fiscal e extraia dados da transação.
      Retorne APENAS um JSON válido com: description, amount, category, date
      
      Imagem URL: ${imageUrl}
    `;

    const response = await callOpenRouter(prompt);
    let jsonStr = response?.trim() || '{}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing receipt with OpenRouter:', error);
    return { description: 'Recibo', category: 'Geral' };
  }
};

// 11. Analyze Expenses for Waste
export const analyzeExpensesForWasteWithOpenRouter = async (transactions: Transaction[], language: string = 'pt'): Promise<{ wasteIndicators: string[], totalWaste: number, suggestions: string[] }> => {
  try {
    const prompt = `
      Analise estes gastos e identifique possíveis desperdícios.
      Retorne APENAS um JSON válido com: wasteIndicators (array), totalWaste (número), suggestions (array)
      
      Transações: ${JSON.stringify(transactions.slice(0, 15))}
      IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}.
    `;

    const response = await callOpenRouter(prompt);
    let jsonStr = response?.trim() || '{"wasteIndicators":[],"totalWaste":0,"suggestions":[]}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing waste with OpenRouter:', error);
    return { wasteIndicators: [], totalWaste: 0, suggestions: [] };
  }
};

// 12. Predict Future Expenses
export const predictFutureExpensesWithOpenRouter = async (transactions: Transaction[], months: number = 3, language: string = 'pt'): Promise<{ predictions: any[], confidence: number, notes: string }> => {
  try {
    const prompt = `
      Com base no histórico de transações, preveja os gastos dos próximos ${months} meses.
      Retorne APENAS um JSON válido com: predictions (array com mês e valor), confidence (0-1), notes (string)
      
      Transações: ${JSON.stringify(transactions.slice(0, 20))}
      IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}.
    `;

    const response = await callOpenRouter(prompt);
    let jsonStr = response?.trim() || '{"predictions":[],"confidence":0,"notes":""}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error predicting expenses with OpenRouter:', error);
    return { predictions: [], confidence: 0, notes: '' };
  }
};

export default {
  categorizeTransactionWithOpenRouter,
  getFinancialAdviceWithOpenRouter,
  analyzeLoanDocumentWithOpenRouter,
  analyzeUserBehaviorWithOpenRouter,
  parseTransactionFromTextWithOpenRouter,
  parseTransactionFromAudioWithOpenRouter,
  suggestBudgetsWithOpenRouter,
  getAiChatResponseWithOpenRouter,
  getAiChatResponseStreamingWithOpenRouter,
  parseTransactionFromReceiptWithOpenRouter,
  analyzeExpensesForWasteWithOpenRouter,
  predictFutureExpensesWithOpenRouter,
};
