import React, { useMemo } from 'react';
import { Alert, generateAlerts } from '../services/alertsService';
import { Transaction, BudgetLimit } from '../types';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertsPanelProps {
  transactions: Transaction[];
  budgets: BudgetLimit[];
  currentInflation: number;
  onClose?: () => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  transactions,
  budgets,
  currentInflation,
  onClose
}) => {
  const alerts = useMemo(() => 
    generateAlerts(transactions, budgets, currentInflation),
    [transactions, budgets, currentInflation]
  );

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          ✅ Tudo certo! Nenhum alerta no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          🔔 Alertas ({alerts.length})
        </h3>
        {onClose && <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X size={18} /></button>}
      </div>

      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`p-4 rounded-xl border-l-4 ${
            alert.severity === 'error'
              ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-900 dark:text-rose-100'
              : alert.severity === 'warning'
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-900 dark:text-amber-100'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-100'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-1 shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-1">{alert.title}</h4>
              <p className="text-xs opacity-90">{alert.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertsPanel;
