# Gestor Financeiro Familiar - Multi-Language Per-User WITH MULTI-PROVIDER AI + TRANSLATOR SYSTEM ✅

## Overview
A comprehensive family financial management platform built with React, TypeScript, and Express.js. This application provides intelligent financial tracking, AI-powered insights using four interchangeable AI providers, and family-friendly features for household budget management. It offers complete multi-language support (Portuguese, English, Spanish, Umbundu, Lingala, French) with per-user language preferences, per-provider AI routing, and a dedicated TRANSLATOR role for managing translations and adding new languages. The project aims to deliver a production-ready, fully internationalized financial management solution with a responsive, mobile-first UI.

## User Preferences
Fast Mode development - small focused edits preferred.

## Current Status

### PostgreSQL Migration: IN PROGRESS 🚀
#### TURNO 1 (COMPLETO) ✅
- **Abstraction Layer Created:** `server/db/manager.ts` rewritten with async/await support
  - `all()` - returns all rows (works with SQLite and PostgreSQL)
  - `get()` - returns first row (works with SQLite and PostgreSQL)
  - `run()` - executes INSERT/UPDATE/DELETE (works with SQLite and PostgreSQL)
  - `transaction()` - atomic operations for both databases
  - `getType()`, `isPostgres()`, `isSQLite()` - utility functions

- **auth.ts Refactored:** 5 endpoints converted to async/await
  - ✅ POST /login - async with try/catch
  - ✅ POST /register - async with try/catch, creates family + user + 16 default budgets
  - ✅ POST /recover-password - async with try/catch
  - ✅ POST /logout - unchanged (no DB operations)
  - ✅ GET /me - unchanged (no DB operations)

- **Testing Status:** ✅ All endpoints tested and working
  - Login curl test returns user object correctly
  - Database manager detects environment (SQLite for dev, PostgreSQL for prod)
  - Error handling implemented with try/catch on all async operations

#### TURNO 2 (NEXT): users.ts
- 89 lines, 6 database operations
- Endpoints: GET /:id, PUT /:id, GET /family, POST /add-to-family, DELETE /:id, POST /promote-role
- Priority: HIGH (depends on auth for role checking)

#### TURNO 3 (NEXT): transactions.ts
- 151 lines, 12 database operations
- Endpoints: GET /, POST /, PUT /:id, DELETE /:id, GET /recurring, POST /recurring
- Priority: HIGH (core app functionality)

### Phase 1: COMPLETE ✅
- Dashboard + Transactions fully translated
- 20 new translation keys added
- Fixed variable naming conflicts (transaction vs t)
- All hardcoded strings replaced

### Phase 2: COMPLETE ✅
- Simulations.tsx: 15 keys translated
- InflationControl.tsx: 14 keys translated
- FamilyMode.tsx: 11 keys translated
- AdminPanel.tsx: 13 keys translated
- 60 new keys across all 6 languages

### Phase 3: COMPLETE ✅
- Tutorial.tsx: 5 keys translated
- EmailNotificationButton.tsx: 8 keys translated
- 67 additional keys added across all 6 languages

### Phase 4: AUTOMATED TRANSLATION MANAGER ✅
- Added `common.view_translations` key to all 6 languages
- **Synced 500 translation keys per language** (from JSON to database on app startup)
- **Automated Statistics Dashboard** - fetches real-time stats from `/api/translations/stats`
- All functionalities verified and working:
  - ✅ Statistics Dashboard (6 language cards with auto-updating percentages)
  - ✅ Export Translations (ZIP with JSON files)
  - ✅ Import Translations (ZIP upload with validation)
  - ✅ Search by Key (real-time filtering)
  - ✅ Filter by Category (dynamic category dropdown)
  - ✅ Show Untranslated (checkbox filter)
  - ✅ Edit Translations (inline textarea for multi-language editing)
  - ✅ Add New Language (language code input + automatic key population)
  - ✅ Access Control (TRANSLATOR & SUPER_ADMIN roles only)
  - ✅ Message Notifications (success/error with auto-dismiss)
  - ✅ Loading States (spinners and disabled buttons)
  - ✅ Multi-language Table (6-column view with color-coding)

### Phase 5: LANGUAGE SUPPORT FIXES ✅
- **Fixed French (FR) Language Type:** Added 'fr' to Language type union
- **Fixed French in Login:** Added 'fr' to default available languages
- **Added French Fallback Translations:** 30+ French translations for fallback
- **Fixed Currency Selector Mobile:** Now visible on all screen sizes with responsive sizing
  - Changed from `hidden md:flex` to `flex` (visible on mobile)
  - Responsive padding: `px-2 md:px-3`
  - Responsive icon spacing: `mr-1 md:mr-2`
  - Responsive text size: `text-xs md:text-sm`

### Phase 6: SYSTEM DARK/LIGHT MODE + LIVE API EXCHANGE RATES + MOBILE SCROLLING FIX + BUG FIXES ✅
- **Auto System Theme Detection:** App now detects device dark/light mode preference and auto-switches
  - Watches for system preference changes using `matchMedia('prefers-color-scheme: dark')`
  - Respects manual toggle preference (doesn't auto-switch if user manually selected)
  - Works on all modern browsers with fallback for older browsers
- **Live API Currency Conversion System:** Real-time rates from free API + automatic fallback
  - **Live API:** Fetches real-time exchange rates from Fawaz Ahmed Currency API (CDN-hosted, free, no auth, no rate limits)
  - **API URL:** `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json`
  - **AOA Support:** Fully supported with real-time rates (1 USD = ~912 AOA)
  - **Conversion Logic:** Converts all currency rates to AOA base for accurate multi-currency display
  - **Fallback Rates:** Hardcoded rates for all 3 providers (BNA, FOREX, PARALLEL) if API fails
  - **Endpoint:** `/api/settings/rates/:provider` with 5-second timeout
  - **Response includes:** source ('live' or 'fallback') and lastUpdate timestamp
  - Supports 7 currencies: USD, EUR, BRL, GBP, CNY, ZAR, JPY
  - Works seamlessly across all 6 languages (PT, EN, ES, UM, LN, FR)
- **Mobile Scrolling Fix:** 
  - Removed `h-full` constraint from content container to allow natural flow
  - Main container uses `overflow-y-auto` for proper scrolling behavior
  - Content now scrolls properly to the end on mobile devices
- **Bug Fixes:**
  - **Currency Conversion Formula:** Fixed multiplication (was using division causing massive values)
    - Before: `5000 AOA ÷ 0.00109 USD = 4,587,155` (wrong)
    - After: `5000 AOA × 0.00109 USD = 5.45` (correct)
  - **Budget Persistence:** Added cache-control headers to prevent browser caching of dynamic API data
    - Headers: `Cache-Control: no-cache, no-store, must-revalidate`
    - Prevents budgets from disappearing due to stale cache
  - **Transaction Variable Naming:** Fixed white page error when clicking transactions
    - Changed map function parameter from `t` to `transaction` to avoid conflicts with translation function
    - Applied fix to both desktop and mobile transaction list views

### FINAL STATISTICS:
- **Total Translation Keys: 500** (all 6 languages synced from JSON)
- **All Components 100% Translated:**
  - Dashboard ✅
  - Transactions ✅
  - Simulations ✅
  - InflationControl ✅
  - FamilyMode ✅
  - AdminPanel ✅
  - Tutorial ✅
  - EmailNotificationButton ✅
  - Translation Manager Header ✅
- **All hardcoded strings → t() calls completed**
- **Languages:** Portuguese (PT), English (EN), Spanish (ES), Umbundu (UM), Lingala (LN), French (FR)

## System Architecture

### UI/UX Decisions
The application features a fully translated user interface supporting dynamic language switching and persistence. A language selector is available on the login screen and within the application. The system provides 16 default translatable budget categories for each user. The UI implements a mobile-first, responsive design with text scaling, dynamic sizing for numeric values, and consistent interactive elements across all components. Frontend-backend language synchronization ensures dynamic loading of available languages.

### Technical Implementations
-   **Multi-Language System (i18n):** Per-user language preference stored in the database. Supports PT, EN, ES, UM, LN, FR. All major components are 100% translated with dynamic language loading from the backend. AI services return localized responses.
-   **AI Abstraction Layer:** A single abstraction layer (`aiProviderService.ts`) routes all AI service calls to the active provider. Users can select their preferred AI provider (Google Gemini, OpenRouter, Groq, Puter). The database tracks the active provider.
-   **Translator Role & Automated Translation Manager:** A dedicated `TRANSLATOR` user role manages all language translations through a comprehensive UI. Features include: live statistics dashboard, search/filter by key or category, show-untranslated filter, multi-language inline editing, ZIP export/import, and add-new-language functionality. All statistics auto-update from the database in real-time (500 keys per language). Access restricted to `TRANSLATOR` and `SUPER_ADMIN` roles. Includes validation system ensuring only complete languages are available to users. Database syncs from JSON files on app startup.
-   **Budget Management:** 16 default budget categories are automatically created for each new user upon registration. Users can create custom categories. Deleting a custom budget automatically relocates associated transactions to a "Geral" (General) category. Default budgets cannot be deleted. An endpoint `/api/budget/create-defaults` initializes default budgets for existing users.
-   **Backend Features:** User creation includes default budget assignment. API endpoints manage settings, budgets, user data, and dynamic API key management. Translation API endpoints support CRUD operations, export, import, stats, and language addition. Budget deletion includes automatic transaction relocation.

### System Design Choices
-   **File Structure:**
    -   `services/`: AI provider abstraction and individual service implementations.
    -   `components/`: UI components with comprehensive translation coverage and responsive design.
    -   `public/locales/`: Stores all JSON translation files.
    -   `server/`: Database schemas and route handlers, including `translations.ts`.
-   **Responsive Design Patterns:** Implemented systematically across components with text scaling, dynamic numeric value sizing, and consistent icon/hover effects.
-   **Translation Key Pattern:** All new keys follow format `module.specific_key` (e.g., `simulations.loan_amount`, `inflation_control.data_source`, `family_mode.family_hub`)
-   **Variable Naming:** Always use named variables in map functions to avoid conflicts with translation function `t` (e.g., `transaction` instead of `t`)

## Deployment

### Ubuntu Production Deployment (Single Command)

The project includes a complete autonomous installation script (`deploy.sh`) for Ubuntu servers that handles:

✅ **Automatic Setup**
- Node.js 20.x installation
- PostgreSQL server with pgAdmin4 admin interface
- Application dependencies
- Database creation and user setup
- Systemd service with auto-restart
- Environment configuration (`.env.production`)
- Production build

✅ **Single Command Installation**
```bash
sudo bash deploy.sh
```

✅ **Configuration Options**
- Local PostgreSQL (default)
- External PostgreSQL URLs (Render, Neon, AWS RDS)
- AI provider API keys
- Custom port configuration

✅ **Post-Installation**
- Application runs at: `http://server-ip:5000`
- Auto-restart on crash
- Logs via: `sudo journalctl -u gestor-financeiro -f`
- Easy updates and maintenance

For detailed installation guide, see `INSTALL.md`

## External Dependencies
-   **AI Providers:**
    -   **Google Gemini:** Requires API key, supports audio and image processing.
    -   **OpenRouter:** Requires API key, offers access to 500+ models.
    -   **Groq:** Free, fast, provides Llama 3.3 (70B) and Mixtral 8x7B models.
    -   **Puter:** 100% free, offers 400+ models (GPT, Claude, Gemini), no API key required.
-   **Libraries:**
    -   `jszip`: For ZIP file generation/parsing in export/import system.
    -   `jspdf` + `jspdf-autotable`: For PDF exports.
-   **Database:** PostgreSQL with local or cloud backends (Neon, Render, AWS RDS).
