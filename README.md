# 🏦 Gestor Financeiro Familiar V3

![Status](https://img.shields.io/badge/Status-Estável-emerald)
![Architecture](https://img.shields.io/badge/Architecture-Full%20Stack-blue)
![Tech](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20TypeScript-blue)
![AI](https://img.shields.io/badge/AI-Powered-purple)

Uma plataforma completa para gestão financeira doméstica com arquitetura server-side robusta. Projetada para famílias que desejam controle total, transparência e insights inteligentes sobre seu dinheiro.

## ✨ Funcionalidades Principais

### 🧠 Inteligência Artificial Integrada
- **Assistente Gemini**: Chatbot financeiro que conhece seus dados e tira dúvidas.
- **Categorização Automática**: A IA detecta categorias baseadas na descrição do gasto.
- **Análise de Contratos (PDF)**: Extração automática de dados de empréstimos bancários para simulação.
- **Detecção de Padrões**: Análise comportamental que identifica se você é "Poupador", "Gastador", etc.

### 📱 Experiência do Usuário (UI/UX)
- **Design Responsivo**: Funciona perfeitamente em Celulares e Desktops.
- **Modo Família**: Interface simplificada para gestão de tarefas e calendário compartilhado.
- **Dark Mode**: Tema escuro nativo para conforto visual.
- **Anexos e Câmera**: Tire fotos de recibos diretamente pelo app ou anexe múltiplos arquivos.

### 💼 Gestão Financeira
- **Controle de Orçamento**: Tetos de gastos com alertas visuais.
- **Metas de Poupança**: Projeção visual de conquistas (ex: Casa Própria).
- **Inflação & Moedas**: Calculadora de poder de compra e suporte a múltiplas moedas (Kz, USD, EUR, etc).
- **Simulador de Empréstimos**: Comparativo entre tabelas PRICE e SAC.

### 🛡️ Administração
- **Hierarquia de Usuários**: Super Admin, Gestor, Membro com permissões granulares.
- **Autenticação Segura**: Senhas com hash bcryptjs, sessões server-side.
- **Multi-família**: Suporte para múltiplas famílias no mesmo servidor.
- **Backup e Restauração**: Segurança total dos seus dados.

### 🗄️ Arquitetura Server-Side
- **Backend Express.js**: API REST robusta com autenticação e autorização.
- **Database SQLite**: Armazenamento persistente de todos os dados.
- **Sessões Seguras**: Gerenciamento de sessões server-side.
- **Role-Based Access**: Controle de acesso baseado em papéis (Super Admin, Manager, Member).

---

## 🚀 Instalação

### Opção 1: Script Automático (Recomendado)

Para instalar em produção no Ubuntu, utilize o script automático:

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

O script irá:
1. Instalar Node.js 20 e dependências do sistema
2. Instalar pacotes npm
3. Compilar a aplicação para produção
4. Criar um usuário systemd para rodar a aplicação
5. Configurar e iniciar o serviço Node.js com restart automático

### Opção 2: Instalação Manual

Consulte o arquivo `README_INSTALL.md` para instruções passo a passo.

### Instalação Local (Desenvolvimento)

```bash
npm install
npm run dev
```

O servidor estará acessível em `http://localhost:5000`

---

## 🔐 Segurança

- ✅ Senhas armazenadas com hash bcryptjs
- ✅ Sessões server-side com proteção CSRF
- ✅ Dados financeiros persistidos no servidor, não no navegador
- ✅ Autenticação obrigatória para todas as rotas sensíveis
- ✅ Controle de acesso baseado em papéis (RBAC)

## 📊 Credenciais Padrão

Para testes iniciais, use:
- **Usuário**: `admin`
- **Senha**: `admin`

⚠️ **Altere a senha na primeira login em produção!**

---

## 🛠️ Estrutura do Projeto

```
├── server/                 # Backend Express.js
│   ├── index.ts           # Servidor principal
│   ├── db/
│   │   └── schema.ts      # Schema SQLite
│   └── routes/            # Endpoints API
├── components/            # Componentes React
├── services/              # Serviços frontend
├── App.tsx               # Componente principal
└── package.json          # Dependências
```

---

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário

### Transações
- `GET /api/transactions` - Listar
- `POST /api/transactions` - Criar
- `PUT /api/transactions/:id` - Atualizar
- `DELETE /api/transactions/:id` - Deletar

### Metas de Poupança
- `GET /api/goals` - Listar
- `POST /api/goals` - Criar
- `PUT /api/goals/:id` - Atualizar
- `DELETE /api/goals/:id` - Deletar
- `POST /api/goals/:id/contribute` - Adicionar aporte

### Orçamentos
- `GET /api/budget/limits` - Listar limites
- `POST /api/budget/limits` - Criar limite
- `DELETE /api/budget/limits/:category` - Deletar limite

### Família (Tarefas & Eventos)
- `GET /api/family/tasks` - Listar tarefas
- `POST /api/family/tasks` - Criar tarefa
- `GET /api/family/events` - Listar eventos
- `POST /api/family/events` - Criar evento

---

## 📈 Monitoramento em Produção

Ver logs da aplicação:
```bash
sudo journalctl -u gestor-financeiro -f
```

Reiniciar aplicação:
```bash
sudo systemctl restart gestor-financeiro
```

Status do serviço:
```bash
sudo systemctl status gestor-financeiro
```

---

## 🤝 Suporte

Para problemas de instalação, consulte `README_INSTALL.md`.

---

**Desenvolvido com ❤️ para famílias que amam controlar seu dinheiro.**
