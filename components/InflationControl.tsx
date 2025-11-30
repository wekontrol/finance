
import React, { useState, useEffect } from 'react';
import { getInflationHistory, getCurrencyHistory } from '../services/marketData';
import { useLanguage } from '../contexts/LanguageContext';
import { InflationDataPoint, CurrencyHistoryPoint, RateProvider } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import Hint from './Hint';

interface InflationControlProps {
  rateProvider: RateProvider;
  setRateProvider: (provider: RateProvider) => void;
  currencyFormatter?: (value: number) => string;
}

const InflationControl: React.FC<InflationControlProps> = ({ 
  rateProvider = 'EXCHANGERATE_API', 
  setRateProvider, 
  currencyFormatter = (val) => `${val.toFixed(2)}` 
}) => {
  const { t } = useLanguage();
  const [data, setData] = useState<InflationDataPoint[]>([]);
  const [currentInflation, setCurrentInflation] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(10000); 
  const [realValue, setRealValue] = useState(10000);
  const [ticker, setTicker] = useState("Aguardando dados de mercado...");

  // Currency Comparison State
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('AOA');
  const [chartPeriod, setChartPeriod] = useState<'1A' | '2A' | '5A'>('1A');
  const [currencyHistory, setCurrencyHistory] = useState<CurrencyHistoryPoint[]>([]);

  useEffect(() => {
    const loadInflationData = async () => {
      try {
        const history = await getInflationHistory();
        setData(history);
        const lastValue = history[history.length - 1].accumulated;
        setCurrentInflation(lastValue);
      } catch (error) {
        console.error('Error loading inflation history:', error);
      }
    };
    
    loadInflationData();
    
    const news = [
      "BNA mantém taxas inalteradas.",
      "Cesta básica sobe 2.3%.",
      "Alta volatilidade no mercado paralelo.",
      "Transportes impulsionam inflação."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setTicker(news[i % news.length]);
      i++;
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const adjusted = purchaseAmount / (1 + (currentInflation / 100));
    setRealValue(adjusted);
  }, [purchaseAmount, currentInflation]);

  useEffect(() => {
    const history = getCurrencyHistory(baseCurrency, targetCurrency, chartPeriod, rateProvider);
    setCurrencyHistory(history);
  }, [baseCurrency, targetCurrency, chartPeriod, rateProvider]);

  const handleSwapCurrencies = () => {
    const temp = baseCurrency;
    setBaseCurrency(targetCurrency);
    setTargetCurrency(temp);
  };

  const currencies = ['AOA', 'USD', 'EUR', 'BRL', 'GBP', 'CNY', 'ZAR', 'JPY'];
  const loss = purchaseAmount - realValue;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10 w-full max-w-full overflow-hidden">
      {/* Header Promocional */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-6 md:p-8 rounded-3xl text-white shadow-lg shadow-rose-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center relative z-10 gap-4 w-full">
          <div className="max-w-xl min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center mb-2 flex-wrap truncate">
              <TrendingUp className="mr-3 shrink-0" /> {t('inflation_control.inflation_control')}
            </h2>
            <p className="text-rose-100 font-medium text-sm md:text-base leading-relaxed break-words">
              {t('inflation_control.protect_purchasing_power')}
            </p>
          </div>
          
          <div className="w-full lg:w-auto mt-2 lg:mt-0 bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/30 shrink-0" data-tour="inflation-source">
            <label className="flex items-center text-xs font-bold text-rose-100 uppercase mb-1 px-1">
              {t('inflation_control.data_source')}
              <Hint text="Escolha entre a taxa oficial do BNA, Forex ou Paralelo." className="text-rose-100" />
            </label>
            <select 
              value={rateProvider} 
              onChange={(e) => setRateProvider(e.target.value as RateProvider)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer w-full text-sm md:text-base appearance-none"
            >
              <option className="text-slate-800" value="BNA">{t('inflation_control.bna_official')}</option>
              <option className="text-slate-800" value="FOREX">{t('inflation_control.forex_global')}</option>
              <option className="text-slate-800" value="PARALLEL">{t('inflation_control.parallel_street')}</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex items-center bg-black/20 backdrop-blur-sm p-3 rounded-xl w-full md:w-fit max-w-full overflow-hidden">
          <AlertCircle size={20} className="text-yellow-400 mr-2 animate-pulse shrink-0" />
          <span className="font-mono text-xs md:text-sm truncate w-full block">{ticker}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Indicador Principal */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col justify-center items-center text-center min-h-[200px] min-w-0">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs md:text-sm uppercase tracking-wider mb-2 truncate max-w-full">{t('inflation_control.accumulated_inflation_12m')}</p>
          <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 dark:text-white tracking-tighter mb-2 tabular-nums break-words max-w-full">
            {currentInflation.toFixed(2)}%
          </h3>
          <div className="flex items-center text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full text-xs md:text-sm font-bold whitespace-nowrap">
            <TrendingUp size={16} className="mr-1" /> {t('inflation_control.uptrend_indicator')}
          </div>
        </div>

        {/* Calculadora de Poder de Compra */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col justify-center min-w-0">
           <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis" data-tour="purchasing-power">
             <ShoppingCart className="mr-2 text-indigo-500 shrink-0" /> {t('inflation_control.purchasing_power_calc')}
           </h3>
           
           <div className="flex flex-col sm:flex-row gap-6 items-center">
             <div className="flex-1 w-full min-w-0">
               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block truncate">{t('inflation_control.nominal_value_kz')}</label>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Kz</span>
                 <input 
                   type="number" 
                   value={purchaseAmount}
                   onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 text-lg md:text-xl font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:ring-0 outline-none transition-all tabular-nums"
                 />
               </div>
               {purchaseAmount > 0 && (
                 <p className="text-right text-xs md:text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 animate-fade-in truncate">
                   {currencyFormatter(purchaseAmount)}
                 </p>
               )}
             </div>

             <div className="hidden sm:block text-slate-300 shrink-0">
               <ArrowRightLeft size={24} />
             </div>

             <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center min-w-0">
               <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 truncate max-w-full">Valor Real (Ajustado)</p>
               <p className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums mb-2 break-all">
                 {currencyFormatter(realValue)}
               </p>
               {loss > 0 && (
                 <div className="flex items-center justify-center text-rose-500 font-bold text-[10px] md:text-xs bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-full animate-pulse w-full max-w-[90%]">
                   <TrendingDown size={14} className="mr-1 shrink-0" />
                   <span className="truncate">{t('inflation_control.loss_label')}{currencyFormatter(loss)}</span>
                 </div>
               )}
             </div>
           </div>
        </div>
      </div>

      {/* Gráfico de Inflação */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 h-80 min-w-0">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm md:text-base">{t('inflation_control.inflation_history')}</h3>
        <div className="w-full h-[85%]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
              />
              <Tooltip 
                 contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: 'white', fontSize: '12px' }} 
                 labelStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="accumulated" name={t('inflation_control.accumulated_percent')} stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              <Area type="monotone" dataKey="rate" name={t('inflation_control.monthly_percent')} stroke="#fbbf24" strokeWidth={3} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparativo de Moedas */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 min-w-0">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2 md:gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl w-full lg:w-auto justify-center overflow-x-auto">
             <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className="bg-transparent font-bold p-2 outline-none dark:text-white cursor-pointer text-sm">
               {currencies.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <button onClick={handleSwapCurrencies} className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm hover:scale-110 transition shrink-0"><ArrowRightLeft size={16} /></button>
             <select value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)} className="bg-transparent font-bold p-2 outline-none dark:text-white cursor-pointer text-sm">
               {currencies.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full lg:w-auto justify-center">
            {['1A', '2A', '5A'].map((p) => (
              <button 
                key={p} 
                onClick={() => setChartPeriod(p as any)}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex-1 ${chartPeriod === p ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-400'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currencyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip 
                 contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: 'white', fontSize: '12px' }} 
                 formatter={(val: number) => val.toFixed(4)}
              />
              <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default InflationControl;
