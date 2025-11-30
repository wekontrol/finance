
import { GoogleGenAI } from "@google/genai";
import { Transaction, LoanSimulation, BudgetLimit, UserBehaviorAnalysis } from "../types";
import { settingsApi } from "./api";

let cachedApiKey: string | null = null;

// Helper to retrieve the API key from server (global setting)
const getApiKey = async () => {
  // Check cache first
  if (cachedApiKey) return cachedApiKey;
  
  try {
    // First try new API configurations table
    const config = await settingsApi.getApiConfig('google_gemini');
    if (config?.apiKey) {
      cachedApiKey = config.apiKey;
      return cachedApiKey;
    }
  } catch (error) {
    // Fail silently - not critical if config doesn't exist yet
  }
  
  return '';
};

// Helper to instantiate the client with the current key
const getAiClient = async () => {
  const apiKey = await getApiKey();
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

// Export functions to manage the key from the UI
export const setGeminiKey = async (key: string) => {
  try {
    await settingsApi.saveApiConfig('google_gemini', key);
    cachedApiKey = key; // Update cache
  } catch (error) {
    console.error("Erro ao salvar chave Gemini:", error);
    throw error;
  }
};

export const hasGeminiKey = async (): Promise<boolean> => {
  const key = await getApiKey();
  return !!key;
};

// --- EXISTING FUNCTIONS REFACTORED ---

export const categorizeTransaction = async (description: string, history: Transaction[] = []): Promise<string> => {
  const exactMatch = history.find(t => t.description.toLowerCase().trim() === description.toLowerCase().trim());
  
  if (exactMatch) {
    return exactMatch.category;
  }

  const ai = await getAiClient();
  if (!ai) return "Geral";

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Você é um assistente financeiro. Categorize a seguinte transação financeira em uma única palavra ou frase curta em Português (Ex: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Salário, Outros).
      
      Descrição da transação: "${description}"
      
      Responda apenas com a categoria.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text ? response.text.trim() : "Geral";
  } catch (error) {
    console.error("Erro ao categorizar transação com Gemini:", error);
    return "Geral";
  }
};

export const getFinancialAdvice = async (transactions: any[], goals: any[], language: string = 'pt'): Promise<string> => {
  const ai = await getAiClient();
  if (!ai) return "Configure sua chave de API do Gemini em Configurações > Integrações para receber conselhos personalizados.";

  const languageNames: Record<string, string> = {
    pt: 'Portuguese',
    en: 'English',
    es: 'Spanish',
    um: 'Umbundu',
    ln: 'Lingala'
  };

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text ? response.text.trim() : "Mantenha o foco!";
  } catch (error) {
    return "Mantenha o foco em suas metas de economia!";
  }
};

export const analyzeLoanDocument = async (text: string): Promise<Partial<LoanSimulation>> => {
  const ai = await getAiClient();
  if (!ai) throw new Error("API Key não configurada. Peça ao Super Admin para configurar em Configurações > Integrações.");

  try {
    const prompt = `
      Analise o texto completo extraído de um documento bancário (PDF).
      Extraia e retorne APENAS um JSON válido com os campos:
      - loanAmount: O valor do "Capital em Dívida" inicial ou "Montante do Empréstimo". (Número).
      - interestRateAnnual: A taxa de juros anual (%) usada para calcular as prestações. (Número).
      - termMonths: O número total de prestações. (Número).
      - system: 'PRICE' ou 'SAC'. Se a prestação for constante, é PRICE. Se a amortização for constante, é SAC.

      Texto do Documento:
      "${text}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text ? response.text.trim() : "{}";

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Erro ao analisar documento:", error);
    throw new Error("Não foi possível analisar o documento. Verifique o formato do PDF.");
  }
};

export const analyzeUserBehavior = async (transactions: Transaction[], language: string = 'pt'): Promise<UserBehaviorAnalysis> => {
  const ai = await getAiClient();
  if (!ai) {
    return {
      summary: "Configure a API do Gemini para análise de comportamento.",
      patterns: [],
      recommendations: []
    };
  }

  const languageNames: Record<string, string> = {
    pt: 'Portuguese',
    en: 'English',
    es: 'Spanish',
    um: 'Umbundu',
    ln: 'Lingala'
  };

  try {
    const summary = JSON.stringify(transactions.slice(0, 20));

    const prompt = `
      Analise o comportamento financeiro baseado nas transações. Retorne um JSON com:
      - summary: Resumo breve (1 frase) do comportamento
      - persona: Um nome descritivo para o perfil de gastos (ex: "Economizador Cauteloso")
      - patternDescription: Descrição de um padrão principal observado
      - tip: Uma dica para melhorar os gastos
      - nextMonthProjection: Projeção de despesa para o próximo mês (número)
      
      IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}, incluindo todas as strings.
      Transações: ${summary}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text ? response.text.trim() : "{}";
    
    // Remove markdown JSON wrapper
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    return {
      summary: "Comece adicionando mais transações.",
      patterns: [],
      recommendations: [],
      persona: "Novo Usuário",
      patternDescription: "Insuficientes dados",
      tip: "Adicione mais transações para análise",
      nextMonthProjection: 0
    };
  }
};

export const parseTransactionFromText = async (text: string): Promise<Partial<Transaction>> => {
  const ai = await getAiClient();
  if (!ai) return { description: text, category: "Geral" };

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text ? response.text.trim() : "{}";
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
      jsonStr = jsonStr.slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    return { description: text, category: "Geral" };
  }
};

export const parseTransactionFromAudio = async (base64Audio: string): Promise<Partial<Transaction>> => {
  const ai = await getAiClient();
  if (!ai) return { description: "Áudio não processado", category: "Geral" };

  try {
    const prompt = `
      Transcreva e extraia dados de uma transação financeira do seguinte áudio. Retorne APENAS um JSON com:
      - description: Descrição
      - amount: Valor
      - type: "INCOME" ou "EXPENSE"
      - category: Categoria
      - date: YYYY-MM-DD
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: base64Audio,
          },
        },
      ],
    });

    let jsonStr = response.text ? response.text.trim() : "{}";
    
    // Remove markdown JSON wrapper
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    return { description: "Áudio não processado", category: "Geral" };
  }
};

export const suggestBudgets = async (transactions: Transaction[]): Promise<any[]> => {
  const ai = await getAiClient();
  if (!ai) return [];
  
  try {
    const categorySpending = transactions.reduce((acc: any, t: any) => {
      if (t.type === 'EXPENSE') {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});

    const prompt = `
      Baseado nestes gastos por categoria: ${JSON.stringify(categorySpending)}
      Sugira 3 limites de orçamento mensais recomendados.
      Responda com array JSON: [{ category: string, suggestedLimit: number }]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text ? response.text.trim() : "[]";
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    return [];
  }
};

export const getAiChatResponse = async (message: string): Promise<string> => {
  const ai = await getAiClient();
  if (!ai) return "API não configurada. Peça ao administrador para configurar a chave Gemini.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
    });
    return response.text?.trim() || "Sem resposta.";
  } catch (error) {
    return "Erro ao processar mensagem.";
  }
};

// --- NEW FEATURES ---

export const getAiChatResponseStreaming = async (message: string): Promise<AsyncIterable<string>> => {
  const ai = await getAiClient();
  if (!ai) throw new Error("API não configurada");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      generationConfig: { temperature: 0.7 }
    });
    
    // Simular streaming dividindo em chunks
    const text = response.text || "Sem resposta.";
    const chunkSize = 20;
    
    return (async function* () {
      for (let i = 0; i < text.length; i += chunkSize) {
        yield text.substring(i, i + chunkSize);
        // Simular latência de streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    })();
  } catch (error) {
    throw new Error("Erro ao processar mensagem com streaming.");
  }
};

export const parseTransactionFromReceipt = async (imageUrl: string): Promise<Partial<Transaction>> => {
  const ai = await getAiClient();
  if (!ai) return { description: "Recibo não processado", category: "Geral" };

  try {
    const prompt = `
      Analise esta foto de recibo/fatura. Extraia os dados de transação financeira. Retorne APENAS um JSON válido com:
      - description: Descrição do estabelecimento/item principal
      - amount: Valor total pago (número)
      - type: "EXPENSE"
      - category: Categoria (uma palavra em Português)
      - date: Data em formato YYYY-MM-DD (se visível, caso contrário hoje)
      
      Se não conseguir extrair algum campo, use um valor padrão razoável.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageUrl.startsWith('data:') ? imageUrl.split(',')[1] : imageUrl,
          },
        },
      ],
    });

    let jsonStr = response.text ? response.text.trim() : "{}";
    
    // Remove markdown JSON wrapper
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Erro ao processar recibo:', error);
    return { description: "Recibo não processado", category: "Geral" };
  }
};

export const analyzeExpensesForWaste = async (transactions: Transaction[], language: string = 'pt'): Promise<{ wasteIndicators: string[], totalWaste: number, suggestions: string[] }> => {
  const ai = await getAiClient();
  if (!ai) return { wasteIndicators: [], totalWaste: 0, suggestions: [] };

  const languageNames: Record<string, string> = {
    pt: 'Portuguese',
    en: 'English',
    es: 'Spanish',
    um: 'Umbundu',
    ln: 'Lingala'
  };

  try {
    const expensesByCategory = transactions.reduce((acc: any, t: any) => {
      if (t.type === 'EXPENSE') {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});

    const prompt = `
      Analise estes gastos e identifique potenciais desperdícios:
      ${JSON.stringify(expensesByCategory)}
      
      Retorne um JSON com:
      - wasteIndicators: Array de 3-5 sinais de possível desperdício (ex: "Gastos elevados em café")
      - totalWaste: Valor estimado em desperdício (número)
      - suggestions: Array de 3 sugestões para reduzir gastos
      
      IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}, incluindo todas as strings.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text ? response.text.trim() : "{}";
    
    // Remove markdown JSON wrapper
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    return { wasteIndicators: [], totalWaste: 0, suggestions: [] };
  }
};

export const predictFutureExpenses = async (transactions: Transaction[], months: number = 3, language: string = 'pt'): Promise<{ predictions: any[], confidence: number, notes: string }> => {
  const ai = await getAiClient();
  if (!ai) return { predictions: [], confidence: 0, notes: "API não configurada" };

  const languageNames: Record<string, string> = {
    pt: 'Portuguese',
    en: 'English',
    es: 'Spanish',
    um: 'Umbundu',
    ln: 'Lingala'
  };

  try {
    const monthlyExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .slice(0, 12)
      .reduce((acc: any, t: any) => {
        const month = new Date(t.date).toISOString().split('T')[0].substring(0, 7);
        acc[month] = (acc[month] || 0) + t.amount;
        return acc;
      }, {});

    const prompt = `
      Analise o histórico de gastos mensais e faça previsões para os próximos ${months} meses:
      Histórico: ${JSON.stringify(monthlyExpenses)}
      
      Retorne um JSON com:
      - predictions: Array com previsões de despesa para cada mês (ex: [{ month: "2025-12", predictedExpense: 500 }])
      - confidence: Nível de confiança da previsão (0-100)
      - notes: Observações sobre a previsão (ex: "Tendência crescente detectada", "Padrão sazonal")
      
      IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}, incluindo todas as strings.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text ? response.text.trim() : "{}";
    
    // Remove markdown JSON wrapper
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    return { predictions: [], confidence: 0, notes: "Erro ao processar previsão" };
  }
};

export default {
  categorizeTransaction,
  getFinancialAdvice,
  analyzeLoanDocument,
  analyzeUserBehavior,
  parseTransactionFromText,
  parseTransactionFromAudio,
  suggestBudgets,
  getAiChatResponse,
  getAiChatResponseStreaming,
  parseTransactionFromReceipt,
  analyzeExpensesForWaste,
  predictFutureExpenses,
  setGeminiKey,
  hasGeminiKey,
};
