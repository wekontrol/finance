import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, SavingsGoal, TransactionType } from '../types';

export const generatePDFReport = (
  transactions: Transaction[],
  savingsGoals: SavingsGoal[],
  period: 'month' | 'year',
  currencyFormatter: (val: number) => string,
  currentUser: any
) => {
  const doc = new jsPDF();
  const now = new Date();
  
  // Filtrar transações pelo período
  const startDate = period === 'month' 
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear(), 0, 1);

  const periodTransactions = transactions.filter(t => 
    new Date(t.date) >= startDate
  );

  // Header
  doc.setFontSize(20);
  doc.text('Relatório Financeiro', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Período: ${startDate.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`, 20, 30);
  doc.text(`Usuário: ${currentUser.name}`, 20, 37);

  let yPosition = 45;

  // Resumo
  const income = periodTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);
  
  const expense = periodTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expense;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Resumo:', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(76, 175, 80);
  doc.text(`Receitas: ${currencyFormatter(income)}`, 25, yPosition);
  yPosition += 7;

  doc.setTextColor(244, 67, 54);
  doc.text(`Despesas: ${currencyFormatter(expense)}`, 25, yPosition);
  yPosition += 7;

  doc.setTextColor(0, 0, 139);
  doc.text(`Saldo: ${currencyFormatter(balance)}`, 25, yPosition);
  yPosition += 12;

  // Tabela de transações
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Transações:', 20, yPosition);
  yPosition += 8;

  const tableData = periodTransactions.map(t => [
    new Date(t.date).toLocaleDateString('pt-BR'),
    t.description,
    t.category,
    t.type,
    currencyFormatter(t.amount)
  ]);

  autoTable(doc, {
    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
    body: tableData,
    startY: yPosition,
    theme: 'grid',
    headStyles: { fillColor: [75, 0, 130] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { left: 20, right: 20 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Metas de poupança
  if (savingsGoals.length > 0) {
    doc.setFontSize(12);
    doc.text('Metas de Poupança:', 20, yPosition);
    yPosition += 8;

    const goalsData = savingsGoals.map(goal => [
      goal.name,
      currencyFormatter(goal.currentAmount),
      currencyFormatter(goal.targetAmount),
      `${((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [['Meta', 'Atual', 'Alvo', 'Progresso']],
      body: goalsData,
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
  }

  // Salvar
  const fileName = `Relatorio_${period === 'month' ? 'Mensal' : 'Anual'}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const generateAnalysisPDF = (
  wasteAnalysis: any,
  forecast: any,
  currencyFormatter: (val: number) => string,
  currentUser: any
) => {
  const doc = new jsPDF();
  const now = new Date();

  // Header
  doc.setFontSize(20);
  doc.text('Análise Financeira Avançada', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Data: ${now.toLocaleDateString('pt-BR')}`, 20, 30);
  doc.text(`Usuário: ${currentUser.name}`, 20, 37);

  let yPosition = 50;

  // Análise de Desperdício
  if (wasteAnalysis) {
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38); // Red
    doc.text('🚨 Análise de Desperdício', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0);
    
    doc.text('Sinais de Desperdício:', 20, yPosition);
    yPosition += 6;
    
    wasteAnalysis.wasteIndicators?.slice(0, 5).forEach((indicator: string) => {
      doc.setTextColor(100);
      doc.text(`• ${indicator}`, 25, yPosition);
      yPosition += 5;
    });

    yPosition += 3;
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(11);
    doc.text(`Estimativa Total de Desperdício: ${currencyFormatter(wasteAnalysis.totalWaste || 0)}`, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Sugestões de Redução:', 20, yPosition);
    yPosition += 6;
    
    wasteAnalysis.suggestions?.slice(0, 3).forEach((suggestion: string) => {
      doc.setTextColor(100);
      doc.text(`• ${suggestion}`, 25, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  }

  // Previsões
  if (forecast && forecast.predictions?.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('📊 Previsões Financeiras', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0);

    const forecastData = forecast.predictions.slice(0, 3).map((p: any) => [
      p.month,
      currencyFormatter(p.predictedExpense || 0)
    ]);

    autoTable(doc, {
      head: [['Mês', 'Previsão de Despesa']],
      body: forecastData,
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.text(`Nível de Confiança: ${forecast.confidence || 0}%`, 20, yPosition);
    yPosition += 5;
    doc.text(`Notas: ${forecast.notes}`, 20, yPosition);
  }

  // Save
  const fileName = `Analise_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
