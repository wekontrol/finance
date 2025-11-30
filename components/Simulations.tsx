
import React, { useState } from 'react';
import { Calculator, Upload, Loader2, DollarSign, Calendar, Percent, PieChart as PieChartIcon, ArrowRight, Save, Clock, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LoanSimulation, AmortizationRow, SavedSimulation } from '../types';
import { analyzeLoanDocument } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Hint from './Hint';

interface SimulationsProps {
  currencyFormatter: (value: number) => string;
  savedSimulations: SavedSimulation[];
  onSaveSimulation: (sim: LoanSimulation, name: string) => void;
  onDeleteSimulation: (id: string) => void;
}

const Simulations: React.FC<SimulationsProps> = ({ 
  currencyFormatter, 
  savedSimulations, 
  onSaveSimulation, 
  onDeleteSimulation 
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<AmortizationRow[]>([]);
  const [saveName, setSaveName] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const [simulation, setSimulation] = useState<LoanSimulation>({
    loanAmount: 1000000,
    interestRateAnnual: 18,
    termMonths: 12,
    system: 'PRICE'
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setLoading(true);

    try {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) throw new Error("Biblioteca PDF não carregada.");

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      // Optimization: Limit to first 5 pages to avoid memory crash on mobile
      const pagesToRead = Math.min(pdf.numPages, 5);

      for (let i = 1; i <= pagesToRead; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Add a space to prevent words from sticking together
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + ' ';
      }

      console.log("Texto extraído:", fullText.substring(0, 100) + "...");
      
      const extractedData = await analyzeLoanDocument(fullText);
      
      setSimulation(prev => ({
        ...prev,
        loanAmount: extractedData.loanAmount || prev.loanAmount,
        interestRateAnnual: extractedData.interestRateAnnual || prev.interestRateAnnual,
        termMonths: extractedData.termMonths || prev.termMonths,
        system: (extractedData.system as 'PRICE' | 'SAC') || prev.system
      }));
      
      alert("Dados extraídos e preenchidos pela IA!");

    } catch (error) {
      console.error(error);
      alert("Erro ao processar PDF. Verifique se é um documento válido.");
    } finally {
      setLoading(false);
    }
  };

  const calculateAmortization = () => {
    const rows: AmortizationRow[] = [];
    const r = simulation.interestRateAnnual / 100 / 12; // Taxa mensal
    const n = simulation.termMonths;
    let balance = simulation.loanAmount;

    if (simulation.system === 'PRICE') {
      const pmt = simulation.loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      
      for (let i = 1; i <= n; i++) {
        const interest = balance * r;
        const principal = pmt - interest;
        balance -= principal;
        
        rows.push({
          month: i,
          payment: pmt,
          interest: interest,
          principal: principal,
          balance: balance > 0 ? balance : 0
        });
      }
    } else {
      // SAC
      const principal = simulation.loanAmount / n;
      
      for (let i = 1; i <= n; i++) {
        const interest = balance * r;
        const pmt = principal + interest;
        balance -= principal;
        
        rows.push({
          month: i,
          payment: pmt,
          interest: interest,
          principal: principal,
          balance: balance > 0 ? balance : 0
        });
      }
    }
    setSchedule(rows);
  };

  const handleSave = () => {
    if (!saveName.trim()) return alert(t('simulations.save_name_required'));
    onSaveSimulation(simulation, saveName);
    setSaveName('');
    setSidebarOpen(true);
  };

  const loadSimulation = (saved: SavedSimulation) => {
    setSimulation({
      loanAmount: saved.loanAmount,
      interestRateAnnual: saved.interestRateAnnual,
      termMonths: saved.termMonths,
      system: saved.system
    });
    setSchedule([]); // Limpa resultado anterior
  };

  const totalInterest = schedule.reduce((acc, curr) => acc + curr.interest, 0);
  const totalPayment = schedule.reduce((acc, curr) => acc + curr.payment, 0);

  return (
    <div className="space-y-8 animate-fade-in relative w-full max-w-full overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 md:p-8 rounded-3xl text-white shadow-lg shadow-purple-500/20 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold flex items-center mb-2">
            <Calculator className="mr-3 shrink-0" /> {t('simulations.intelligent_simulation')}
          </h2>
          <p className="text-purple-100 font-medium max-w-xl text-sm md:text-base">
            {t('simulations.upload_pdf_instructions')}
          </p>
        </div>
        <button 
          data-tour="saved-simulations"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <Clock size={20} /> {t('simulations.saved_simulations')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Entrada */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700">
          <div className="mb-6">
            <label 
              data-tour="pdf-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition bg-slate-50 dark:bg-slate-800/50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                {loading ? <Loader2 className="animate-spin text-primary-500 mb-2" /> : <Upload className="text-slate-400 mb-2" />}
                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">
                  {loading ? t('simulations.analyzing_pdf') : t('simulations.upload_pdf_bank')}
                </p>
                <p className="text-xs text-slate-400">{t('simulations.pdf_formats')}</p>
              </div>
              <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} disabled={loading} />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('simulations.loan_amount')}</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input type="number" value={simulation.loanAmount} onChange={e => setSimulation({...simulation, loanAmount: Number(e.target.value)})} className="w-full pl-9 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums" />
              </div>
              <div className="text-xs text-primary-600 dark:text-primary-400 font-bold mt-1 text-right truncate">
                {currencyFormatter(simulation.loanAmount)}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('simulations.annual_rate_percent')}</label>
              <div className="relative">
                <Percent size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input type="number" step="0.1" value={simulation.interestRateAnnual} onChange={e => setSimulation({...simulation, interestRateAnnual: Number(e.target.value)})} className="w-full pl-9 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('simulations.term_months')}</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input type="number" value={simulation.termMonths} onChange={e => setSimulation({...simulation, termMonths: Number(e.target.value)})} className="w-full pl-9 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums" />
              </div>
            </div>
            <div>
              <label className="flex items-center text-xs font-bold text-slate-500 uppercase mb-1">
                {t('simulations.system_label')}
                <Hint text="PRICE: Parcelas fixas, juros maiores no final. SAC: Parcelas decrescentes, paga-se menos juros no total." />
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                 <button onClick={() => setSimulation({...simulation, system: 'PRICE'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${simulation.system === 'PRICE' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-400'}`}>PRICE</button>
                 <button onClick={() => setSimulation({...simulation, system: 'SAC'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${simulation.system === 'SAC' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-400'}`}>SAC</button>
              </div>
            </div>
            <button onClick={calculateAmortization} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-500/30 flex justify-center items-center">
               {t('simulations.calculate_button')} <ArrowRight size={18} className="ml-2" />
            </button>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('simulations.save_scenario')}</label>
              <div className="flex gap-2">
                <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Nome (ex: Banco X)" className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm min-w-0" />
                <button onClick={handleSave} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 p-2 rounded-xl text-slate-600 dark:text-slate-300 shrink-0">
                  <Save size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados e Gráficos */}
        <div className="lg:col-span-2 space-y-6">
          {schedule.length > 0 ? (
            <>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase">{t('simulations.total_paid')}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white tabular-nums truncate">{currencyFormatter(totalPayment)}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase">{t('simulations.total_interest')}</p>
                    <p className="text-2xl font-bold text-rose-500 tabular-nums truncate">{currencyFormatter(totalInterest)}</p>
                 </div>
               </div>

               <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 h-80 min-w-0">
                 <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">Composição da Parcela</h3>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={schedule}>
                     <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                     <XAxis dataKey="month" hide />
                     <YAxis fontSize={10} tickFormatter={(v) => `${v/1000}k`} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }}
                        formatter={(val: number) => currencyFormatter(val)}
                     />
                     <Legend />
                     <Bar dataKey="principal" name="Amortização" stackId="a" fill="#10b981" />
                     <Bar dataKey="interest" name="Juros" stackId="a" fill="#ef4444" />
                   </BarChart>
                 </ResponsiveContainer>
               </div>

               <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden">
                 <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300">Tabela de Amortização</div>
                 <div className="max-h-60 overflow-y-auto overflow-x-auto">
                   <table className="w-full text-sm text-left min-w-[500px]">
                     <thead className="bg-slate-50 dark:bg-slate-700/30 sticky top-0 text-slate-400 text-xs uppercase">
                       <tr>
                         <th className="p-3">Mês</th>
                         <th className="p-3 text-right">Prestação</th>
                         <th className="p-3 text-right">Juros</th>
                         <th className="p-3 text-right">Amortização</th>
                         <th className="p-3 text-right">Saldo</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                       {schedule.map(row => (
                         <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                           <td className="p-3 font-bold">{row.month}</td>
                           <td className="p-3 text-slate-800 dark:text-white font-medium text-right whitespace-nowrap tabular-nums">{currencyFormatter(row.payment)}</td>
                           <td className="p-3 text-rose-500 text-right whitespace-nowrap tabular-nums">{currencyFormatter(row.interest)}</td>
                           <td className="p-3 text-emerald-600 text-right whitespace-nowrap tabular-nums">{currencyFormatter(row.principal)}</td>
                           <td className="p-3 text-slate-500 text-right whitespace-nowrap tabular-nums">{currencyFormatter(row.balance)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 min-h-[300px]">
               <PieChartIcon size={64} className="mb-4" />
               <p>Preencha os dados e calcule para ver o resultado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar de Simulações Salvas */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-800 z-50 shadow-2xl p-6 overflow-y-auto border-l border-slate-100 dark:border-slate-700 animate-slide-left">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg dark:text-white">Cenários Salvos</h3>
               <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600"><ArrowRight size={20}/></button>
             </div>
             <div className="space-y-3">
               {savedSimulations.length === 0 && <p className="text-slate-400 text-sm italic">Nenhum cenário salvo.</p>}
               {savedSimulations.map(sim => (
                 <div key={sim.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary-300 transition group">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-slate-800 dark:text-white truncate pr-2">{sim.name}</h4>
                       <button onClick={() => onDeleteSimulation(sim.id)} className="text-slate-300 hover:text-rose-500 shrink-0"><Trash2 size={14}/></button>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Valor: {currencyFormatter(sim.loanAmount)}</p>
                      <p>Taxa: {sim.interestRateAnnual}% | {sim.termMonths} meses</p>
                      <p>Sistema: {sim.system}</p>
                    </div>
                    <button onClick={() => { loadSimulation(sim); setSidebarOpen(false); }} className="w-full mt-3 bg-white dark:bg-slate-600 text-primary-600 dark:text-white text-xs font-bold py-2 rounded-lg shadow-sm hover:bg-primary-50">
                      Carregar
                    </button>
                 </div>
               ))}
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Simulations;
