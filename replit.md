# Gestor Financeiro Familiar - Multi-Language Per-User WITH MULTI-PROVIDER AI + TRANSLATOR SYSTEM ✅

## Overview
A comprehensive family financial management platform built with React, TypeScript, and Express.js. This application provides intelligent financial tracking, AI-powered insights using four interchangeable AI providers, and family-friendly features for household budget management. It offers complete multi-language support with per-user language preferences, per-provider AI routing, and a dedicated TRANSLATOR role for managing translations and adding new languages. The project aims to deliver a production-ready, fully internationalized financial management solution with a responsive, mobile-first UI. Key capabilities include multi-language support, an AI abstraction layer, an automated translation manager, robust budget management, real-time currency conversion, and auto system theme detection.

## User Preferences
Fast Mode development - small focused edits preferred.

## System Architecture

### UI/UX Decisions
The application features a fully translated user interface supporting dynamic language switching and persistence. A language selector is available on the login screen and within the application. The system provides 16 default translatable budget categories for each user. The UI implements a mobile-first, responsive design with text scaling, dynamic sizing for numeric values, and consistent interactive elements across all components. Frontend-backend language synchronization ensures dynamic loading of available languages. Premium UI effects include global CSS animations (shimmer, float, glow-pulse, gradient-shift, bounce-subtle), glassmorphism, premium button ripple effects, card hover effects, and dynamic gradient text animation. All UI improvements are optimized for both light and dark modes.

### Technical Implementations
-   **Multi-Language System (i18n):** Per-user language preference stored in the database. Supports PT, EN, ES, UM, LN, FR. All major components are 100% translated with dynamic language loading from the backend. AI services return localized responses.
-   **AI Abstraction Layer:** A single abstraction layer routes all AI service calls to the active provider. Users can select their preferred AI provider (Google Gemini, OpenRouter, Groq, Puter). The database tracks the active provider.
-   **Translator Role & Automated Translation Manager:** A dedicated `TRANSLATOR` user role manages all language translations through a comprehensive UI, including a live statistics dashboard, search/filter, multi-language inline editing, ZIP export/import, and add-new-language functionality. Access is restricted, and a validation system ensures only complete languages are available.
-   **Budget Management:** 16 default budget categories are automatically created for each new user. Users can create custom categories. Deleting a custom budget relocates associated transactions to a "Geral" category.
-   **Real-time Currency Conversion:** Fetches live exchange rates from a free CDN-hosted API with fallback to hardcoded rates. Supports 7 currencies (USD, EUR, BRL, GBP, CNY, ZAR, JPY) and converts to AOA base.
-   **System Theme Detection:** Automatically detects and applies the user's device dark/light mode preference, respecting manual overrides, with dynamic color adaptation for charts and UI elements.
-   **Auto-Update System:** All data modifications (transactions, goals, budgets, users, family tasks/events, simulations) are updated immediately at the beginning of lists, sorted by date (most recent first), and reset the page to 1 for a zero-lag user experience.
-   **Database:** Uses SQLite for production due to its zero external setup, performance with WAL and caching, and ease of deployment on platforms like Replit.

### System Design Choices
-   **File Structure:** Organized with `services/` for AI providers, `components/`, `public/locales/` for JSON translations, and `server/` for backend logic.
-   **Responsive Design Patterns:** Implemented systematically with text scaling, dynamic numeric value sizing, and consistent interactive elements.
-   **Translation Key Pattern:** All new keys follow `module.specific_key` format.
-   **Variable Naming:** Uses named variables in map functions to avoid conflicts with the translation function `t`.

## External Dependencies
-   **AI Providers:** Google Gemini, OpenRouter, Groq (Llama 3.3, Mixtral 8x7B), Puter (GPT, Claude, Gemini).
-   **Libraries:** `jszip` (for ZIP file generation/parsing), `jspdf` + `jspdf-autotable` (for PDF exports).
-   **Database:** SQLite.
-   **Currency API:** Fawaz Ahmed Currency API (CDN-hosted).
---

## 🤖 AI INSIGHTS SYSTEM (6 IA TOOLS) - December 11, 2025 ✅

**Status:** ✅ FULLY IMPLEMENTED
**Location:** Planificação & IA > 6 Abas Interativas

### Features Implemented
1. **📊 Análise Inteligente de Gastos**
   - Categoria com maior gasto (top spending)
   - Todas as categorias ordenadas por valor
   - ⚠️ Detecção de anomalias (30% acima do normal)

2. **📈 Previsão de Fluxo de Caixa**
   - Gasto médio diário (últimos 30 dias)
   - Projeção mensal automática
   - Saldo projetado (positivo/negativo)

3. **💪 Score de Saúde Financeira**
   - Pontuação 0-100 visual
   - Tendência (Melhorando/Estável/Piorando)
   - Penalidades por overspending e anomalias

4. **💰 Sugestões de Economia Personalizadas**
   - Reduzir gastos em categorias principais
   - Investigar picos (anomalias)
   - Impacto financeiro estimado

5. **📝 Resumos em Linguagem Natural**
   - Análise conversacional do mês
   - Padrões e tendências
   - Recomendações personalizadas

6. **💬 Chat Financeiro IA**
   - Responde perguntas sobre finanças
   - Personalizadas com contexto do usuário
   - Integração com AI providers existentes

### Architecture
- **Component:** `components/AIInsights.tsx` (480+ linhas)
- **UI:** 6 abas (tabs) interativas com scroll
- **Data:** Calcula em tempo real de transactions + budgets
- **IA Integration:** ✅ TODAS as 6 funcionalidades integradas com `aiProviderService` para routing automático por função

### AI Provider Routing por Função
Cada funcionalidade é roteada para o provider IA selecionado pelo usuário:
1. ✅ `spending_analysis` - Análise de Gastos
2. ✅ `cash_forecast` - Previsão de Fluxo
3. ✅ `financial_health_score` - Score de Saúde
4. ✅ `savings_suggestions` - Sugestões de Economia
5. ✅ `natural_summary` - Resumo em Linguagem Natural
6. ✅ `financial_chat` - Chat Financeiro

Cada função chama `getProviderForFunction()` que retorna o provider configurado (Google Gemini, OpenRouter, Groq, Puter) ou usa o default.

### Files Modified
- ✅ `App.tsx` - Import + renderização do AIInsights
- ✅ `components/AIInsights.tsx` - Novo componente com 6 features (480+ linhas)
- ✅ `types.ts` - Uses TransactionType enum

### Key Metrics Calculated
- Categoria principal (top 1)
- Todas as categorias (sorted by amount DESC)
- Anomalias (>130% da média)
- Saldo projetado (income - projected expenses)
- Score de saúde (0-100)
- Sugestões personalizadas com impacto estimado

---

## 📊 EXCEL IMPORT/EXPORT SYSTEM (Turn 8 + Turn 21-22 FIXES)

**Status:** ✅ FULLY IMPLEMENTED & ALL BUGS FIXED
**Last Updated:** December 11, 2025

### Features Implemented
1. **Excel Import**
   - ✅ Button "Importar" (purple, UploadCloud icon)
   - ✅ Accepts .xlsx and .xls files
   - ✅ Automatic validation with detailed error messages
   - ✅ Parser using XLSX library
   - ✅ Bulk import with success feedback
   - ✅ Auto-reset to page 1 after import

2. **Excel Template Download**
   - ✅ Button "Modelo" (blue, Download icon)
   - ✅ Downloads custom uploaded template (FIXED in Turn 21!)
   - ✅ If no custom template exists, generates default
   - ✅ Portuguese instructions included
   - ✅ Formatted columns with proper widths
   - ✅ File: "modelo_transacoes.xlsx"

3. **Excel Template Upload (Custom Templates)**
   - ✅ Settings > Gerenciar Modelos Excel > Upload
   - ✅ Accepts .xlsx and .xls formats
   - ✅ Stores custom template in `public/templates/`
   - ✅ Persists across sessions
   - ✅ GET endpoint serves stored template

4. **Smart Data Type Handling (NEW - Turn 22)**
   - ✅ **Coluna A (Data):** Detecta datas em formato numérico Excel e converte automaticamente
   - ✅ Aceita formatos: YYYY-MM-DD, DD/MM/YYYY, ou coluna formatada como data
   - ✅ **Coluna D (Valor):** Aceita números diretos do Excel sem conversão
   - ✅ Mais leniente com validação - converte automaticamente

5. **Excel Structure**
   - Headers (A9): Data, Descrição, Categoria, Valor, Tipo, Recorrente, Frequência
   - Data range: **A10:G124** (115 linhas disponíveis)
   - Data format: Pode ser DD/MM/YYYY, YYYY-MM-DD, ou número formatado no Excel
   - Tipo: "Receita" or "Despesa"
   - Recorrente: "Sim" or "Não"

### TURN 21 CRITICAL FIX ✅
**Problem:** User uploads custom template but "Modelo" button downloads hardcoded default instead
**Root Cause:** Template saved as `modelo_modelo.xlsx` but GET endpoint searched for `modelo_transacoes.xlsx`
**Solution:** Modified `server/routes/templates.ts` to force filename `modelo_transacoes.xlsx` regardless of input
**Testing:** GET endpoint returns HTTP 200 with correct file (16,617 bytes)

### TURN 22 IMPORT FIXES ✅
**Problem:** Excel cells com formatação de "número" ou "data" eram rejeitadas como inválidas
**Solutions:**
1. Função `excelDateToISO()` converte números de data Excel (serial numbers) para YYYY-MM-DD
2. Coluna D (Valor) agora aceita números diretamente sem conversão string
3. Mensagens de erro detalhadas mostram exatamente qual linha está com problema
4. Validação de linha corrigida: mostra linha real do Excel (A10 = linha 10, não linha 2)

### Files Modified
- ✅ `services/excelService.ts` - Smart import + date conversion + better error messages
- ✅ `server/routes/templates.ts` - Filename standardization
- ✅ `components/Transactions.tsx` - UI for Modelo/Importar buttons
- ✅ `package.json` - xlsx library

### How to Use (Now Works Correctly!)
1. **Prepare your Excel file:**
   - Coluna A (Data): Selecione as células > Botão direito > "Formatar Células" > "Data"
   - Coluna D (Valor): Selecione as células > Botão direito > "Formatar Células" > "Número"
   
2. **Download or upload template:**
   - (Optional) Settings > Gerenciar Modelos Excel > Upload seu modelo customizado
   - Transactions > Modelo > Download do template padrão ou customizado

3. **Fill and import:**
   - Preencha suas transações em Excel (linhas 10-124)
   - Transactions > Importar > Upload do seu arquivo
   - Sistema valida e mostra contagem de sucesso

---

## 🎯 DEFAULT BUDGETS SYSTEM (Turn 12-18)

**Status:** ✅ FULLY IMPLEMENTED + Super Admin Manager ✅
**Date:** December 11, 2025

### 16 Default Budget Categories
1. Renda (Income) - 0 Kz
2. Energia (Energy) - 150 Kz
3. Água (Water) - 80 Kz
4. Transporte (Transportation) - 200 Kz
5. Alimentação (Food) - 300 Kz
6. Combustível (Fuel) - 200 Kz
7. Compras domésticas (Household Shopping) - 150 Kz
8. Lazer (Entertainment) - 150 Kz
9. Roupas (Clothing) - 100 Kz
10. Saúde (Health) - 200 Kz
11. Cuidados pessoais (Personal Care) - 80 Kz
12. **Reparação** (Repairs) - 150 Kz
13. **Manutenção** (Maintenance) - 150 Kz
14. Presentes (Gifts) - 100 Kz
15. Eventos (Events) - 200 Kz
16. Viagens (Travel) - 300 Kz

### Budget Defaults Manager (Super Admin Only)
**UI Location:** Settings > General > "Gerenciar Categorias"
- ✅ Modal popup with all 16 categories
- ✅ Editable limit fields for each category
- ✅ Save/Reset/Cancel actions
- ✅ Real-time backend sync via `/api/budget/defaults`
- ✅ Database stores in `app_settings` table

### Files Added/Modified
- ✅ **NEW:** `components/BudgetDefaultsManager.tsx` - Super Admin modal
- ✅ **MODIFIED:** `server/routes/budget.ts` - GET/POST `/defaults` endpoints
- ✅ **MODIFIED:** `components/AdminPanel.tsx` - Button + modal integration
