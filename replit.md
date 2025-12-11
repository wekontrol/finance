# Gestor Financeiro Familiar - Multi-Language Per-User WITH MULTI-PROVIDER AI + TRANSLATOR SYSTEM ✅

## Overview
A comprehensive family financial management platform built with React, TypeScript, and Express.js. This application provides intelligent financial tracking, AI-powered insights using four interchangeable AI providers, and family-friendly features for household budget management. It offers complete multi-language support with per-user language preferences, per-provider AI routing, and a dedicated TRANSLATOR role for managing translations and adding new languages. The project aims to deliver a production-ready, fully internationalized financial management solution with a responsive, mobile-first UI. Key capabilities include:
- Multi-language support (PT, EN, ES, UM, LN, FR) with dynamic switching.
- AI abstraction layer for flexible integration with various AI providers.
- Automated translation manager for efficient localization.
- Robust budget management with default categories and transaction relocation.
- Real-time currency conversion with live API rates and fallback mechanisms.
- Auto system theme detection for dark/light mode.

## User Preferences
Fast Mode development - small focused edits preferred.

## System Architecture

### UI/UX Decisions
The application features a fully translated user interface supporting dynamic language switching and persistence. A language selector is available on the login screen and within the application. The system provides 16 default translatable budget categories for each user. The UI implements a mobile-first, responsive design with text scaling, dynamic sizing for numeric values, and consistent interactive elements across all components. Frontend-backend language synchronization ensures dynamic loading of available languages.

### Technical Implementations
-   **Multi-Language System (i18n):** Per-user language preference stored in the database. Supports PT, EN, ES, UM, LN, FR. All major components are 100% translated with dynamic language loading from the backend. AI services return localized responses.
-   **AI Abstraction Layer:** A single abstraction layer (`aiProviderService.ts`) routes all AI service calls to the active provider. Users can select their preferred AI provider (Google Gemini, OpenRouter, Groq, Puter). The database tracks the active provider.
-   **Translator Role & Automated Translation Manager:** A dedicated `TRANSLATOR` user role manages all language translations through a comprehensive UI. Features include: live statistics dashboard, search/filter by key or category, show-untranslated filter, multi-language inline editing, ZIP export/import, and add-new-language functionality. All statistics auto-update from the database in real-time (500 keys per language). Access restricted to `TRANSLATOR` and `SUPER_ADMIN` roles. Includes validation system ensuring only complete languages are available to users. Database syncs from JSON files on app startup.
-   **Budget Management:** 16 default budget categories are automatically created for each new user upon registration. Users can create custom categories. Deleting a custom budget automatically relocates associated transactions to a "Geral" (General) category. Default budgets cannot be deleted. An endpoint `/api/budget/create-defaults` initializes default budgets for existing users.
-   **Real-time Currency Conversion:** Fetches live exchange rates from a free CDN-hosted API with fallback to hardcoded rates. Supports 7 currencies (USD, EUR, BRL, GBP, CNY, ZAR, JPY) and converts to AOA base.
-   **System Theme Detection:** Automatically detects and applies the user's device dark/light mode preference, respecting manual overrides.

### System Design Choices
-   **File Structure:** `services/` for AI providers, `components/` for UI, `public/locales/` for JSON translations, `server/` for database schemas and route handlers.
-   **Responsive Design Patterns:** Implemented systematically across components with text scaling, dynamic numeric value sizing, and consistent interactive elements.
-   **Translation Key Pattern:** All new keys follow `module.specific_key` format.
-   **Variable Naming:** Uses named variables in map functions to avoid conflicts with the translation function `t`.

## External Dependencies
-   **AI Providers:**
    -   **Google Gemini:** Requires API key.
    -   **OpenRouter:** Requires API key, offers access to 500+ models.
    -   **Groq:** Provides Llama 3.3 (70B) and Mixtral 8x7B models.
    -   **Puter:** Offers 400+ models (GPT, Claude, Gemini), no API key required.
-   **Libraries:**
    -   `jszip`: For ZIP file generation/parsing in the export/import system.
    -   `jspdf` + `jspdf-autotable`: For PDF exports.
-   **Database:** PostgreSQL (local or cloud backends like Neon, Render, AWS RDS).
-   **Currency API:** Fawaz Ahmed Currency API (CDN-hosted) for live exchange rates.