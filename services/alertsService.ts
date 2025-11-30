import { Transaction, BudgetLimit } from '../types';

export interface Alert {
  id: string;
  type: 'budget_exceeded' | 'recurring_due' | 'inflation_alert';
  title: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
  timestamp: string;
  read: boolean;
}

export const generateAlerts = (
  transactions: Transaction[],
  budgets: BudgetLimit[],
  currentInflation: number
): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Verificar limites de orçamento excedidos
  budgets.forEach(budget => {
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.category === budget.category &&
        t.type === 'EXPENSE' &&
        tDate.getFullYear() === now.getFullYear() &&
        tDate.getMonth() === now.getMonth();
    });

    const spent = monthTransactions.reduce((acc, t) => acc + t.amount, 0);

    if (spent > budget.limit) {
      alerts.push({
        id: `budget_${budget.id}`,
        type: 'budget_exceeded',
        title: `⚠️ Orçamento Excedido: ${budget.category}`,
        message: `Você gastou ${(spent - budget.limit).toFixed(2)} AOA a mais que o limite de ${budget.limit.toFixed(2)} AOA`,
        severity: 'error',
        timestamp: now.toISOString(),
        read: false
      });
    }
  });

  // 2. Verificar transações recorrentes vencendo
  const recurringDue = transactions.filter(t => {
    if (!t.is_recurring || !t.next_due_date) return false;
    const dueDate = new Date(t.next_due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  });

  recurringDue.forEach(t => {
    alerts.push({
      id: `recurring_${t.id}`,
      type: 'recurring_due',
      title: `📅 Transação Recorrente: ${t.description}`,
      message: `${t.description} (${t.amount.toFixed(2)} AOA) vence em breve`,
      severity: 'info',
      timestamp: now.toISOString(),
      read: false
    });
  });

  // 3. Alerta de inflação alta
  if (currentInflation > 20) {
    alerts.push({
      id: 'inflation_alert',
      type: 'inflation_alert',
      title: '📈 Inflação Elevada',
      message: `Inflação acumulada em ${currentInflation.toFixed(2)}%. Seu poder de compra está diminuindo.`,
      severity: 'warning',
      timestamp: now.toISOString(),
      read: false
    });
  }

  return alerts;
};
