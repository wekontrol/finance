// Puter.js AI Service - Comprehensive implementation of all 14 services
// No API keys required - Puter handles auth transparently

import { Transaction, LoanSimulation, UserBehaviorAnalysis } from '../types';

const languageNames: Record<string, string> = {
  pt: 'Portuguese',
  en: 'English',
  es: 'Spanish',
  um: 'Umbundu',
  ln: 'Lingala'
};

// @ts-ignore - Puter.js is loaded dynamically
const getPuter = () => window.puter;

export const hasPuterEnabled = (): boolean => {
  const provider = localStorage.getItem('ai_provider');
  return provider === 'puter';
};

export const setPuterAsDefault = (): void => {
  try {
    localStorage.setItem('ai_provider', 'puter');
  } catch (error) {
    console.error('Error setting Puter as default:', error);
    throw error;
  }
};

// 1. Categorize Transaction
export const categorizeTransactionWithPuter = async (description: string): Promise<string> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    console.warn('Puter.js not loaded');
    return 'Geral';
  }

  try {
    const prompt = `
      Você é um assistente financeiro. Categorize a seguinte transação financeira em uma única palavra ou frase curta em Português (Ex: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Salário, Outros).
      
      Descrição da transação: "${description}"
      
      Responda apenas com a categoria.
    `;

    const response = await puter.ai.chat(prompt, { model: 'gpt-4.1-nano' });
    return response?.trim() || 'Geral';
  } catch (error) {
    console.error('Error categorizing with Puter:', error);
    return 'Geral';
  }
};

// 2. Financial Advice
export const getFinancialAdviceWithPuter = async (transactions: any[], goals: any[], language: string = 'pt'): Promise<string> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    return 'Configure Puter em Configurações > Integrações para receber conselhos personalizados.';
  }

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

    const response = await puter.ai.chat(prompt, { model: 'gpt-4.1-nano' });
    return response?.trim() || 'Mantenha o foco!';
  } catch (error) {
    console.error('Error getting financial advice from Puter:', error);
    return 'Mantenha o foco em suas metas de economia!';
  }
};

// 3. Analyze Loan Document
export const analyzeLoanDocumentWithPuter = async (text: string): Promise<Partial<LoanSimulation>> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    return {};
  }

  try {
    const prompt = `
      Analise o seguinte texto de documento de empréstimo e extraia as informações principais.
      Retorne APENAS um JSON válido com: principal, taxaJuros, prazoMeses
      
      Texto: ${text}
    `;

    const response = await puter.ai.chat(prompt, { model: 'gpt-4.1-nano' });
    let jsonStr = response?.trim() || '{}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing loan document with Puter:', error);
    return {};
  }
};

// 4. Analyze User Behavior
export const analyzeUserBehaviorWithPuter = async (transactions: Transaction[], language: string = 'pt'): Promise<UserBehaviorAnalysis> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    return { persona: 'Usuário', patternDescription: '', tip: '', nextMonthProjection: 0 };
  }

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

    const response = await puter.ai.chat(prompt, { model: 'gpt-4.1-nano' });
    let jsonStr = response?.trim() || '{}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing user behavior with Puter:', error);
    return { persona: 'Usuário', patternDescription: '', tip: '', nextMonthProjection: 0 };
  }
};

// 5. Parse Transaction from Text
export const parseTransactionFromTextWithPuter = async (text: string): Promise<Partial<Transaction>> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    return { description: text, category: 'Geral' };
  }

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

    const response = await puter.ai.chat(prompt, { model: 'gpt-4.1-nano' });
    let jsonStr = response?.trim() || '{}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing transaction with Puter:', error);
    return { description: text, category: 'Geral' };
  }
};

// 6. Parse Transaction from Audio
export const parseTransactionFromAudioWithPuter = async (base64Audio: string): Promise<Partial<Transaction>> => {
  // Puter does not support audio transcription reliably
  // Use Gemini for audio processing
  console.warn('Puter does not support audio transcription. Please use Gemini provider for audio features.');
  return { 
    description: '', 
    category: 'Geral',
    error: 'Puter não suporta processamento de áudio. Use Gemini para esta funcionalidade.'
  };
};

// 7. Suggest Budgets
export const suggestBudgetsWithPuter = async (transactions: Transaction[]): Promise<any[]> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    return [];
  }

  try {
    const prompt = `
      Com base no histórico de transações fornecido, sugira limites de orçamento por categoria.
      Retorne APENAS um JSON válido com array de { categoria, limite }
      
      Transações: ${JSON.stringify(transactions.slice(0, 20))}
    `;

    const response = await puter.ai.chat(prompt, { model: 'gpt-4.1-nano' });
    let jsonStr = response?.trim() || '[]';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error suggesting budgets with Puter:', error);
    return [];
  }
};

// 8. Chat Response
export const getAiChatResponseWithPuter = async (message: string): Promise<string> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    return 'Puter.js não foi carregado.';
  }

  try {
    const response = await puter.ai.chat(message, { model: 'gpt-4.1-nano' });
    return response?.trim() || '';
  } catch (error) {
    console.error('Error getting chat response from Puter:', error);
    return 'Desculpe, não consegui processar sua mensagem.';
  }
};

// 9. Chat Response Streaming
export const getAiChatResponseStreamingWithPuter = async (message: string): Promise<AsyncIterable<string>> => {
  const puter = getPuter();
  
  return (async function* () {
    if (typeof puter === 'undefined') {
      yield 'Puter.js não foi carregado.';
      return;
    }

    try {
      // Puter doesn't have native streaming, so we simulate it
      const response = await puter.ai.chat(message, { model: 'gpt-4.1-nano', stream: true });
      for await (const chunk of response) {
        yield chunk;
      }
    } catch (error) {
      console.error('Error streaming response from Puter:', error);
      // Fallback to non-streaming
      try {
        const response = await puter.ai.chat(message, { model: 'gpt-4.1-nano' });
        yield response?.trim() || 'Erro ao processar sua mensagem.';
      } catch (e) {
        yield 'Erro ao processar sua mensagem.';
      }
    }
  })();
};

// 10. Parse Transaction from Receipt (OCR)
export const parseTransactionFromReceiptWithPuter = async (imageUrl: string): Promise<Partial<Transaction>> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    return { description: 'Recibo', category: 'Geral' };
  }

  try {
    const prompt = `
      Analise este recibo/nota fiscal e extraia dados da transação.
      Retorne APENAS um JSON válido com: description, amount, category, date
      
      Imagem URL: ${imageUrl}
    `;

    // Use vision capability
    const response = await puter.ai.chat(prompt, { model: 'gpt-4.1-nano', image: imageUrl });
    let jsonStr = response?.trim() || '{}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing receipt with Puter:', error);
    return { description: 'Recibo', category: 'Geral' };
  }
};

// 11. Analyze Expenses for Waste
export const analyzeExpensesForWasteWithPuter = async (transactions: Transaction[], language: string = 'pt'): Promise<{ wasteIndicators: string[], totalWaste: number, suggestions: string[] }> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    return { wasteIndicators: [], totalWaste: 0, suggestions: [] };
  }

  try {
    const prompt = `
      Analise estes gastos e identifique possíveis desperdícios.
      Retorne APENAS um JSON válido com: wasteIndicators (array), totalWaste (número), suggestions (array)
      
      Transações: ${JSON.stringify(transactions.slice(0, 15))}
      IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}.
    `;

    const response = await puter.ai.chat(prompt, { model: 'gpt-4.1-nano' });
    let jsonStr = response?.trim() || '{"wasteIndicators":[],"totalWaste":0,"suggestions":[]}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing waste with Puter:', error);
    return { wasteIndicators: [], totalWaste: 0, suggestions: [] };
  }
};

// 12. Predict Future Expenses
export const predictFutureExpensesWithPuter = async (transactions: Transaction[], months: number = 3, language: string = 'pt'): Promise<{ predictions: any[], confidence: number, notes: string }> => {
  const puter = getPuter();
  if (typeof puter === 'undefined') {
    return { predictions: [], confidence: 0, notes: '' };
  }

  try {
    const prompt = `
      Com base no histórico de transações, preveja os gastos dos próximos ${months} meses.
      Retorne APENAS um JSON válido com: predictions (array com mês e valor), confidence (0-1), notes (string)
      
      Transações: ${JSON.stringify(transactions.slice(0, 20))}
      IMPORTANTE: Responda APENAS em ${languageNames[language] || 'Portuguese'}.
    `;

    const response = await puter.ai.chat(prompt, { model: 'gpt-4.1-nano' });
    let jsonStr = response?.trim() || '{"predictions":[],"confidence":0,"notes":""}';

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3).slice(0, jsonStr.lastIndexOf('```'));
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error predicting expenses with Puter:', error);
    return { predictions: [], confidence: 0, notes: '' };
  }
};

export default {
  hasPuterEnabled,
  setPuterAsDefault,
  categorizeTransactionWithPuter,
  getFinancialAdviceWithPuter,
  analyzeLoanDocumentWithPuter,
  analyzeUserBehaviorWithPuter,
  parseTransactionFromTextWithPuter,
  parseTransactionFromAudioWithPuter,
  suggestBudgetsWithPuter,
  getAiChatResponseWithPuter,
  getAiChatResponseStreamingWithPuter,
  parseTransactionFromReceiptWithPuter,
  analyzeExpensesForWasteWithPuter,
  predictFutureExpensesWithPuter,
};
