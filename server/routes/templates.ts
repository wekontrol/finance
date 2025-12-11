import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = express.Router();

// Configurar multer para upload
const uploadsDir = path.join(process.cwd(), 'public', 'templates');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const modelType = (req.body.modelType || 'modelo');
    const extension = file.originalname.endsWith('.xls') ? '.xls' : '.xlsx';
    cb(null, `modelo_${modelType}${extension}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .xlsx e .xls são permitidos'));
    }
  }
});

/**
 * GET /api/templates/modelo_transacoes
 * Serve o arquivo modelo de importação de transações
 */
router.get('/modelo_transacoes', (req, res) => {
  try {
    const templatePath = path.join(uploadsDir, 'modelo_transacoes.xlsx');
    
    if (fs.existsSync(templatePath)) {
      res.download(templatePath, 'modelo_transacoes.xlsx', (err) => {
        if (err) {
          console.error('Erro ao fazer download do arquivo:', err);
          res.status(500).json({ error: 'Erro ao fazer download do arquivo' });
        }
      });
    } else {
      res.status(404).json({ error: 'Arquivo modelo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao servir arquivo modelo:', error);
    res.status(500).json({ error: 'Erro ao servir arquivo modelo' });
  }
});

/**
 * POST /api/templates/upload
 * Faz upload de um arquivo modelo (transações ou metas)
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const modelType = req.body.modelType || 'transacoes';
    console.log(`✅ Modelo '${modelType}' atualizado: ${req.file.filename}`);
    
    res.json({
      success: true,
      message: `Modelo ${modelType} atualizado com sucesso`,
      file: req.file.filename
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
});

export default router;
