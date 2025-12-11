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

## 📊 EXCEL IMPORT/EXPORT SYSTEM (Turn 8)

**Status:** ✅ FULLY IMPLEMENTED
**Date:** December 11, 2025

### Features Added
1. **Excel Import**
   - ✅ Button "Importar" (purple, UploadCloud icon)
   - ✅ Accepts .xlsx and .xls files
   - ✅ Automatic validation (date, description, amount)
   - ✅ Parser using XLSX library
   - ✅ Bulk import with success feedback
   - ✅ Auto-reset to page 1 after import

2. **Excel Template Download**
   - ✅ Button "Modelo" (blue, Download icon)
   - ✅ Pre-filled with 3 example transactions
   - ✅ Portuguese instructions included
   - ✅ Formatted columns with proper widths
   - ✅ File: "modelo_transacoes.xlsx"

3. **Excel Structure**
   - Headers: Data, Descrição, Categoria, Valor, Tipo, Recorrente, Frequência
   - Data format: YYYY-MM-DD
   - Tipo: "Receita" or "Despesa"
   - Recorrente: "Sim" or "Não"

### Files Modified
- ✅ `services/excelService.ts` - New service with import/export functions
- ✅ `components/Transactions.tsx` - Added 3 new buttons (Modelo, Importar, CSV)
- ✅ `package.json` - Added xlsx library

### How to Use
1. Click "Modelo" to download template
2. Fill your transactions in Excel
3. Click "Importar" to upload and auto-import all transactions
4. System validates and shows success count

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

### Changes Made (Turn 12)
- ✅ Removed "Juros / Multas" (Interest/Fines) - consolidated into savings tracking
- ✅ Split "Reparações e Manutenção" into separate "Reparação" and "Manutenção" categories
- ✅ Fixed alignment issue in currency selector button (AO/AOA vertical alignment)
- ✅ Enhanced error logging in budget creation endpoint
- ✅ Ensured predictFutureExpenses is properly exported and routed through AI provider system

### New: Budget Defaults Manager (Turn 14-18) ✅
**For Super Admin ONLY:**
- ✅ UI: **Settings > General > "Gerenciar Categorias"** button
- ✅ Modal popup with editable limit fields for all 16 categories
- ✅ Save/Reset/Cancel actions
- ✅ Real-time backend sync via `/api/budget/defaults` endpoints
- ✅ Database stores defaults in `app_settings` table with keys like `budget_default_Alimentação`

**How it works:**
1. Super Admin clicks button in Settings > General
2. Popup shows all 16 categories with current limit values
3. Super Admin edits any limit and clicks "Salvar"
4. New defaults are stored in app_settings
5. All new users get these defaults automatically

### Database Implementation
- All 16 budgets marked as `is_default = 1`
- Auto-created for new users via `/api/budget/create-defaults` endpoint
- System defaults stored in `app_settings` table (keys: `budget_default_*`)
- GET/POST `/api/budget/defaults` for Super Admin management only
- Defaults can be edited by Super Admin without affecting existing user budgets
- Comprehensive validation and synchronization system in place

### Files Added/Modified
- ✅ **NEW:** `components/BudgetDefaultsManager.tsx` - Modal component for Super Admin
- ✅ **MODIFIED:** `server/routes/budget.ts` - Added `GET/POST /defaults` endpoints
- ✅ **MODIFIED:** `components/AdminPanel.tsx` - Added button + modal integration

### Known Issues / Notes for Next Phase
- Session persistence: Some users may need to refresh to see budgets on first load (Express session management)
- All 16 categories correctly stored in database with proper limits
- API endpoints fully functional and tested with database
- Super Admin management system fully operational
