import * as XLSX from 'xlsx';
import { Transaction, TransactionType } from '../types';

/**
 * Exporta transações para um arquivo Excel com template
 */
export const exportTransactionsToExcel = (transactions: Transaction[], currencyFormatter: (value: number) => string) => {
  const ws_data = [
    ['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo', 'Recorrente', 'Frequência'],
    ...transactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.amount,
      t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
      t.isRecurring ? 'Sim' : 'Não',
      t.frequency || ''
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [
    { wch: 12 }, // Data
    { wch: 25 }, // Descrição
    { wch: 15 }, // Categoria
    { wch: 12 }, // Valor
    { wch: 12 }, // Tipo
    { wch: 12 }, // Recorrente
    { wch: 15 }  // Frequência
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transações');
  XLSX.writeFile(wb, 'transacoes.xlsx');
};

/**
 * Cria um arquivo Excel em branco com o template para importação
 */
export const downloadExcelTemplate = () => {
  const template = [
    ['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo', 'Recorrente', 'Frequência'],
    ['2024-01-15', 'Exemplo: Salário', 'Salário', '5000.00', 'Receita', 'Não', ''],
    ['2024-01-20', 'Exemplo: Supermercado', 'Alimentação', '150.50', 'Despesa', 'Não', ''],
    ['2024-01-25', 'Exemplo: Aluguel', 'Habitação', '1200.00', 'Despesa', 'Sim', 'monthly'],
    ['', '', '', '', '', '', ''],
    ['INSTRUÇÕES:', '', '', '', '', '', ''],
    ['Data: YYYY-MM-DD (ex: 2024-01-15)', '', '', '', '', '', ''],
    ['Tipo: "Receita" ou "Despesa"', '', '', '', '', '', ''],
    ['Recorrente: "Sim" ou "Não"', '', '', '', '', '', ''],
    ['Frequência: "weekly", "biweekly", "monthly", "quarterly", "semiannual", "yearly" (opcional)', '', '', '', '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transações');
  XLSX.writeFile(wb, 'modelo_transacoes.xlsx');
};

/**
 * Importa transações de um arquivo Excel
 */
export const importTransactionsFromExcel = (file: File): Promise<Omit<Transaction, 'id'>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 0 });

        if (rows.length === 0) {
          reject(new Error('Arquivo Excel vazio'));
          return;
        }

        const transactions: Omit<Transaction, 'id'>[] = [];

        (rows as any[]).forEach((row, index) => {
          try {
            const date = String(row['Data'] || '').trim();
            const description = String(row['Descrição'] || '').trim();
            const category = String(row['Categoria'] || 'Geral').trim();
            const amount = parseFloat(String(row['Valor'] || '0'));
            const typeStr = String(row['Tipo'] || 'Despesa').trim().toLowerCase();
            const isRecurringStr = String(row['Recorrente'] || 'Não').trim().toLowerCase();
            const frequency = String(row['Frequência'] || 'monthly').trim();

            // Validar data
            if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
              console.warn(`Linha ${index + 2}: Data inválida: ${date}`);
              return;
            }

            // Validar descrição
            if (!description) {
              console.warn(`Linha ${index + 2}: Descrição vazia`);
              return;
            }

            // Validar valor
            if (isNaN(amount) || amount <= 0) {
              console.warn(`Linha ${index + 2}: Valor inválido: ${row['Valor']}`);
              return;
            }

            // Determinar tipo
            const type = typeStr.includes('receita') || typeStr.includes('income') 
              ? TransactionType.INCOME 
              : TransactionType.EXPENSE;

            // Determinar recorrência
            const isRecurring = isRecurringStr.includes('sim') || isRecurringStr.includes('yes');

            const transaction: Omit<Transaction, 'id'> = {
              userId: '', // Será preenchido pelo componente
              description,
              amount,
              type,
              category,
              date,
              attachments: [],
              isRecurring,
              frequency: isRecurring ? (frequency as any) : undefined
            };

            transactions.push(transaction);
          } catch (error) {
            console.warn(`Erro ao processar linha ${index + 2}:`, error);
          }
        });

        if (transactions.length === 0) {
          reject(new Error('Nenhuma transação válida encontrada no arquivo'));
          return;
        }

        resolve(transactions);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsBinaryString(file);
  });
};
