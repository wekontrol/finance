import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * GET /api/templates/modelo_transacoes
 * Serve o arquivo modelo de importação de transações
 * Se não existir arquivo customizado, retorna 404
 */
router.get('/modelo_transacoes', (req, res) => {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'modelo_transacoes.xlsx');
    
    // Verificar se o arquivo existe
    if (fs.existsSync(templatePath)) {
      res.download(templatePath, 'modelo_transacoes.xlsx', (err) => {
        if (err) {
          console.error('Erro ao fazer download do arquivo:', err);
          res.status(500).json({ error: 'Erro ao fazer download do arquivo' });
        }
      });
    } else {
      // Arquivo não existe - retorna 404 para o frontend gerar um padrão
      res.status(404).json({ error: 'Arquivo modelo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao servir arquivo modelo:', error);
    res.status(500).json({ error: 'Erro ao servir arquivo modelo' });
  }
});

export default router;
