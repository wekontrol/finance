import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction } from '../types';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  currencyFormatter: (val: number) => string;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#06b6d4', '#84cc16'];

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ transactions, currencyFormatter }) => {
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'EXPENSE');
    const byCategory: Record<string, number> = {};

    expenses.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = categoryData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-bold">{data.name}</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{currencyFormatter(data.value)}</p>
          <p className="text-xs text-slate-500">{percent}%</p>
        </div>
      );
    }
    return null;
  };

  if (categoryData.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl text-center">
        <p className="text-slate-500 dark:text-slate-400">Sem despesas registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
          >
            {categoryData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {categoryData.map((cat, idx) => (
          <div key={cat.name} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{cat.name}</span>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{currencyFormatter(cat.value)}</p>
            <p className="text-xs text-slate-400">
              {total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
