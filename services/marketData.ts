
import { ExchangeRates, InflationDataPoint, CurrencyHistoryPoint, RateProvider } from "../types";

// Fallback defaults se API falhar
const RATES_BNA: Record<string, number> = {
  USD: 926.50,
  EUR: 1003.20,
  BRL: 188.10,
  GBP: 1168.00,
  CNY: 127.30,
  ZAR: 49.10,
  JPY: 6.35
};

// Mercado Forex (USA/EUR spread ~1%)
const RATES_FOREX: Record<string, number> = {
  USD: 930.10,
  EUR: 1008.50,
  BRL: 189.50,
  GBP: 1175.20,
  CNY: 128.00,
  ZAR: 49.50,
  JPY: 6.40
};

// Mercado Paralelo (Spread alto)
const RATES_PARALLEL: Record<string, number> = {
  USD: 1150.00,
  EUR: 1240.00,
  BRL: 230.00,
  GBP: 1450.00,
  CNY: 160.00,
  ZAR: 60.00,
  JPY: 8.00
};

export const getExchangeRates = async (provider: RateProvider = 'EXCHANGERATE_API'): Promise<ExchangeRates> => {
  try {
    // Buscar do backend que cacheia e atualiza diariamente
    const response = await fetch(`/api/settings/rates/${provider}`);
    if (response.ok) {
      const data = await response.json();
      return {
        AOA: data.AOA || 1,
        USD: data.USD || RATES_BNA.USD,
        EUR: data.EUR || RATES_BNA.EUR,
        BRL: data.BRL || RATES_BNA.BRL,
        GBP: data.GBP || RATES_BNA.GBP,
        CNY: data.CNY || RATES_BNA.CNY,
        ZAR: data.ZAR || RATES_BNA.ZAR,
        JPY: data.JPY || RATES_BNA.JPY,
        lastUpdate: data.lastUpdate || new Date().toISOString(),
        source: data.source
      };
    }
  } catch (error) {
    console.warn('Error fetching live exchange rates, using fallback:', error);
  }

  // Fallback: usar valores armazenados em cache ou defaults
  let selectedRates = RATES_BNA;
  if (provider === 'FOREX') selectedRates = RATES_FOREX;
  if (provider === 'PARALLEL') selectedRates = RATES_PARALLEL;
  if (provider === 'EXCHANGERATE_API') selectedRates = RATES_BNA;
  if (provider === 'FAWAZ_AHMED') selectedRates = RATES_BNA;

  return {
    AOA: 1,
    USD: selectedRates.USD,
    EUR: selectedRates.EUR,
    BRL: selectedRates.BRL,
    GBP: selectedRates.GBP,
    CNY: selectedRates.CNY,
    ZAR: selectedRates.ZAR,
    JPY: selectedRates.JPY,
    lastUpdate: new Date().toISOString(),
    source: 'fallback'
  };
};

// Alias para manter compatibilidade se necessário, mas idealmente usar getExchangeRates
export const getBNARates = () => getExchangeRates('BNA');

// Cache para inflação (12 horas)
let inflationCache: { data: InflationDataPoint[], timestamp: number } | null = null;
const INFLATION_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 horas

export const getInflationHistory = async (): Promise<InflationDataPoint[]> => {
  // Verificar cache
  const now = Date.now();
  if (inflationCache && (now - inflationCache.timestamp) < INFLATION_CACHE_DURATION) {
    return inflationCache.data;
  }

  try {
    // Buscar dados reais da World Bank API (Angola - Inflation rate)
    const response = await fetch('https://api.worldbank.org/v2/country/AO/indicator/FP.CPI.TOTL.ZG?format=json&per_page=100&date=2020:2025');
    
    if (!response.ok) throw new Error('Failed to fetch World Bank inflation data');
    
    const data = await response.json();
    const records = data[1] || [];
    
    // Filtrar e organizar dados por ano
    const yearlyData = records
      .filter((item: any) => item.value !== null && item.date)
      .sort((a: any, b: any) => parseInt(a.date) - parseInt(b.date));
    
    if (yearlyData.length === 0) throw new Error('No inflation data available');
    
    // Simular dados mensais a partir dos dados anuais
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    const latestYearData = yearlyData[yearlyData.length - 1];
    const baseInflation = parseFloat(latestYearData.value);
    
    let result: InflationDataPoint[] = [];
    let currentAcc = baseInflation;
    
    // Distribuir inflação anual em dados mensais (realista)
    months.forEach((month, index) => {
      // Aproximar inflação mensal a partir do acumulado anual
      const monthlyRate = baseInflation / 12 + (Math.sin(index) * 0.5);
      
      result.push({
        month,
        rate: Number(Math.max(0, monthlyRate).toFixed(2)),
        accumulated: Number(currentAcc.toFixed(2))
      });
    });
    
    // Cache resultado
    inflationCache = { data: result, timestamp: now };
    return result;
    
  } catch (error) {
    console.warn('Error fetching World Bank inflation data, using fallback:', error);
    
    // Fallback para dados locais simulados (se API falhar)
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const seed = 42;
    let currentAcc = 24.5; // Valor padrão Angola 2024
    
    const result = months.map((month, index) => {
      const randomMonth = seededRandom(seed + index);
      const randomAcc = seededRandom(seed + index + 100);
      const monthlyChange = (randomMonth * 1.0) + 1.5;
      currentAcc += (randomAcc * 0.4) + 0.1;
      
      return {
        month,
        rate: Number(monthlyChange.toFixed(2)),
        accumulated: Number(currentAcc.toFixed(2))
      };
    });
    
    inflationCache = { data: result, timestamp: now };
    return result;
  }
};

// Seeded random number generator para garantir dados consistentes
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const getCurrencyHistory = (base: string, target: string, period: '1A' | '2A' | '5A', provider: RateProvider = 'BNA'): CurrencyHistoryPoint[] => {
  const months = period === '1A' ? 12 : period === '2A' ? 24 : 60;
  const data: CurrencyHistoryPoint[] = [];
  const now = new Date();

  // Selecionar o set de taxas correto
  let ratesSource = RATES_BNA;
  if (provider === 'FOREX') ratesSource = RATES_FOREX;
  if (provider === 'PARALLEL') ratesSource = RATES_PARALLEL;

  // Calcular taxa cruzada ATUAL (Hoje)
  const baseRateAOA = base === 'AOA' ? 1 : ratesSource[base] || 1;
  const targetRateAOA = target === 'AOA' ? 1 : ratesSource[target] || 1;
  
  // Taxa atual = (Valor Base em AOA) / (Valor Target em AOA)
  const currentRate = baseRateAOA / targetRateAOA;

  // Gerar histórico RETROATIVO a partir da taxa atual para garantir alinhamento
  let rateIterator = currentRate;

  // Volatilidade baseada no provedor
  let volatility = 0.015; // 1.5% variação mensal (BNA)
  if (provider === 'PARALLEL') volatility = 0.035; // 3.5% (Mercado informal é mais instável)
  if (provider === 'FOREX') volatility = 0.02;

  // Gerar seed determinística baseada na combinação de parâmetros
  // Isso garante que os mesmos parâmetros sempre geram os mesmos dados
  const seed = base.charCodeAt(0) + target.charCodeAt(0) + 
               (provider === 'BNA' ? 1 : provider === 'FOREX' ? 2 : 3) * 100 +
               (period === '1A' ? 1 : period === '2A' ? 2 : 3) * 1000;

  // Adiciona o ponto atual primeiro
  data.push({
    date: 'Atual',
    rate: Number(rateIterator.toFixed(4))
  });

  for (let i = 1; i <= months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    // Usar seeded random ao invés de Math.random() para consistência
    const randomValue = seededRandom(seed + i);
    const change = 1 + (randomValue * volatility * 2 - volatility);
    
    // Aplicar variação inversa
    rateIterator = rateIterator / change;

    data.unshift({ // Adiciona no início do array
      date: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      rate: Number(rateIterator.toFixed(4))
    });
  }

  return data;
};