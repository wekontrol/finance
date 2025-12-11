import * as XLSX from 'xlsx';
import { Transaction, TransactionType } from '../types';
import { getFrequencyLabel, parseFrequencyFromLabel } from './frequencyTranslations';

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
 * Adapta para o idioma do usuário (português, espanhol, umbundu)
 */
export const downloadExcelTemplate = (language: string = 'pt') => {
  const isPortuguese = language === 'pt';
  const isSpanish = language === 'es';
  const isUmbundu = language === 'um';

  // Headers in user's language
  let headers: string[];
  let exampleRows: string[][];
  let instructions: string[][];

  if (isSpanish) {
    headers = ['Fecha', 'Descripción', 'Categoría', 'Valor', 'Tipo', 'Recurrente', 'Frecuencia'];
    exampleRows = [
      ['15/01/2024', 'Ejemplo: Salario', 'Salario', '5000.00', 'Ingreso', 'No', ''],
      ['20/01/2024', 'Ejemplo: Supermercado', 'Alimentación', '150.50', 'Gasto', 'No', ''],
      ['25/01/2024', 'Ejemplo: Alquiler', 'Vivienda', '1200.00', 'Gasto', 'Sí', 'Mensual'],
    ];
    instructions = [
      ['INSTRUCCIONES:', '', '', '', '', '', ''],
      ['Fecha: DD/MM/YYYY (ej: 15/01/2024)', '', '', '', '', '', ''],
      ['Tipo: "Ingreso" o "Gasto"', '', '', '', '', '', ''],
      ['Recurrente: "Sí" o "No"', '', '', '', '', '', ''],
      ['Frecuencia: Semanal, Quincenal, Mensual, Trimestral, Semestral, Anual (opcional)', '', '', '', '', '', ''],
    ];
  } else if (isUmbundu) {
    headers = ['Dési', 'Okwikwixi', 'Ongolo', 'Vavali', 'Ohala', 'Odula', 'Olambi'];
    exampleRows = [
      ['15/01/2024', 'Okwenzhela: Okwenzhela', 'Okwenzhela', '5000.00', 'Okusama', 'Okilá', ''],
      ['20/01/2024', 'Okwenzhela: Malonda', 'Okudya', '150.50', 'Okutula', 'Okilá', ''],
      ['25/01/2024', 'Okwenzhela: Nzo', 'Inda', '1200.00', 'Okutula', 'Eie', 'Lingilá'],
    ];
    instructions = [
      ['OKUSALA:', '', '', '', '', '', ''],
      ['Dési: DD/MM/YYYY (okusala: 15/01/2024)', '', '', '', '', '', ''],
      ['Ohala: "Okusama" o "Okutula"', '', '', '', '', '', ''],
      ['Odula: "Eie" o "Okilá"', '', '', '', '', '', ''],
      ['Olambi: Lingana, Lingana ya mavali, Lingilá, Lingilá ya kuna, Lingilá ya sitanu, Angelu (okusikila)', '', '', '', '', '', ''],
    ];
  } else {
    // Portuguese (default)
    headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo', 'Recorrente', 'Frequência'];
    exampleRows = [
      ['15/01/2024', 'Exemplo: Salário', 'Salário', '5000.00', 'Receita', 'Não', ''],
      ['20/01/2024', 'Exemplo: Supermercado', 'Alimentação', '150.50', 'Despesa', 'Não', ''],
      ['25/01/2024', 'Exemplo: Aluguel', 'Habitação', '1200.00', 'Despesa', 'Sim', 'Mensal'],
    ];
    instructions = [
      ['INSTRUÇÕES:', '', '', '', '', '', ''],
      ['Data: DD/MM/YYYY (ex: 15/01/2024)', '', '', '', '', '', ''],
      ['Tipo: "Receita" ou "Despesa"', '', '', '', '', '', ''],
      ['Recorrente: "Sim" ou "Não"', '', '', '', '', '', ''],
      ['Frequência: Semanal, Quinzenal, Mensal, Trimestral, Semestral, Anual (opcional)', '', '', '', '', '', ''],
    ];
  }

  const template = [
    headers,
    ...exampleRows,
    ['', '', '', '', '', '', ''],
    ...instructions,
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
 * Suporta idiomas: português (pt), espanhol (es), umbundu (um)
 */
export const importTransactionsFromExcel = (file: File, language: string = 'pt'): Promise<Omit<Transaction, 'id'>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Ler apenas do intervalo A9:G124 (dados das transações)
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 0,
          range: 'A9:G124'
        });

        if (rows.length === 0) {
          reject(new Error('Nenhuma transação encontrada no intervalo A9:G124'));
          return;
        }

        const transactions: Omit<Transaction, 'id'>[] = [];

        (rows as any[]).forEach((row, index) => {
          try {
            // Support multiple languages for column headers
            const isSpanish = language === 'es';
            const isUmbundu = language === 'um';

            const dateKey = isSpanish ? 'Fecha' : isUmbundu ? 'Dési' : 'Data';
            const descKey = isSpanish ? 'Descripción' : isUmbundu ? 'Okwikwixi' : 'Descrição';
            const catKey = isSpanish ? 'Categoría' : isUmbundu ? 'Ongolo' : 'Categoria';
            const valKey = isSpanish ? 'Valor' : isUmbundu ? 'Vavali' : 'Valor';
            const typeKey = isSpanish ? 'Tipo' : isUmbundu ? 'Ohala' : 'Tipo';
            const recurKey = isSpanish ? 'Recurrente' : isUmbundu ? 'Odula' : 'Recorrente';
            const freqKey = isSpanish ? 'Frecuencia' : isUmbundu ? 'Olambi' : 'Frequência';

            let date = String(row[dateKey] || '').trim();
            const description = String(row[descKey] || '').trim();
            const category = String(row[catKey] || (isSpanish ? 'General' : isUmbundu ? 'Ongolo' : 'Geral')).trim();
            const amount = parseFloat(String(row[valKey] || '0'));
            const typeStr = String(row[typeKey] || (isSpanish ? 'Gasto' : isUmbundu ? 'Okutula' : 'Despesa')).trim().toLowerCase();
            const isRecurringStr = String(row[recurKey] || (isSpanish ? 'No' : isUmbundu ? 'Okilá' : 'Não')).trim().toLowerCase();
            let frequency = String(row[freqKey] || 'monthly').trim().toLowerCase();

            // Validar e converter data (aceita DD/MM/YYYY ou YYYY-MM-DD)
            if (!date) {
              console.warn(`Linha ${index + 2}: Data vazia`);
              return;
            }
            
            // Detectar e converter formato DD/MM/YYYY para YYYY-MM-DD
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
              const [day, month, year] = date.split('/');
              date = `${year}-${month}-${day}`;
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
              console.warn(`Linha ${index + 2}: Data inválida: ${date}. Use DD/MM/YYYY`);
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

            // Determinar tipo (suporta múltiplas línguas)
            let type = TransactionType.EXPENSE;
            if (isSpanish) {
              type = typeStr.includes('ingreso') || typeStr.includes('income') ? TransactionType.INCOME : TransactionType.EXPENSE;
            } else if (isUmbundu) {
              type = typeStr.includes('okusama') || typeStr.includes('income') ? TransactionType.INCOME : TransactionType.EXPENSE;
            } else {
              type = typeStr.includes('receita') || typeStr.includes('income') ? TransactionType.INCOME : TransactionType.EXPENSE;
            }

            // Determinar recorrência (suporta múltiplas línguas)
            let isRecurring = false;
            if (isSpanish) {
              isRecurring = isRecurringStr.includes('sí') || isRecurringStr.includes('yes');
            } else if (isUmbundu) {
              isRecurring = isRecurringStr.includes('eie') || isRecurringStr.includes('yes');
            } else {
              isRecurring = isRecurringStr.includes('sim') || isRecurringStr.includes('yes');
            }

            // Parse frequency (converter de label localizado para chave em inglês)
            frequency = parseFrequencyFromLabel(frequency, language as any);

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
