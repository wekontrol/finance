
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TRANSLATOR = 'TRANSLATOR',
  MEMBER = 'MEMBER'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface SecurityQuestion {
  question: string;
  answer: string;
}

export interface User {
  id: string;
  username: string; // New: Login ID
  password?: string; // New: Stored (in real app should be hashed, here plain/mock)
  email?: string; // Email for notifications
  securityQuestion?: SecurityQuestion; // New: Recovery
  name: string;
  role: UserRole;
  avatar: string;
  status: UserStatus;
  createdBy?: string; // ID of the parent/creator
  birthDate?: string; // YYYY-MM-DD
  allowParentView?: boolean; // If > 18, allow parent to see finances
  languagePreference?: string; // User's language: pt, en, es, um, ln, fr
  familyId?: string; // ID grouping family members
}

export interface TransactionAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // Base64 Data URI
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string; // ISO Date
  category: string;
  type: TransactionType;
  attachments?: TransactionAttachment[]; // New: Multiple attachments
  attachmentName?: string; // Deprecated: Kept for backward compatibility
  isRecurring?: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';
  nextDueDate?: string;
}

export enum TransactionType {
  INCOME = 'RECEITA',
  EXPENSE = 'DESPESA'
}

export interface GoalTransaction {
  id: string;
  userId: string;
  date: string;
  amount: number;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  interestRate?: number; // Annual Percentage Yield (APY)
  history: GoalTransaction[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
}

export interface BudgetLimit {
  category: string;
  limit: number;
}

export interface CategoryBudget {
  category: string;
  limit: number;
  spent: number;
}

export interface BackupConfig {
  networkPath: string;
  rootDataFolder: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  lastBackup: string | null;
}

export type RateProvider = 'BNA' | 'FOREX' | 'PARALLEL' | 'EXCHANGERATE_API' | 'FAWAZ_AHMED';

export interface ExchangeRates {
  [key: string]: number | string; // Index signature for dynamic access
  AOA: number;
  USD: number;
  EUR: number;
  BRL: number;
  GBP: number;
  CNY: number;
  ZAR: number;
  JPY: number;
  lastUpdate: string;
  source?: string; // 'live', 'cached', or 'fallback'
}

export interface CurrencyHistoryPoint {
  date: string;
  rate: number;
}

export interface InflationDataPoint {
  month: string;
  rate: number; // Taxa mensal
  accumulated: number; // Acumulado 12 meses
}

export interface LoanSimulation {
  loanAmount: number;
  interestRateAnnual: number;
  termMonths: number;
  system: 'PRICE' | 'SAC';
}

export interface SavedSimulation extends LoanSimulation {
  id: string;
  name: string;
  createdAt: string;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface FamilyTask {
  id: string;
  description: string;
  assignedTo: string; // userId
  isCompleted: boolean;
  dueDate?: string;
}

export interface FamilyEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'general' | 'bill' | 'birthday' | 'meeting';
  description?: string;
}

export interface TutorialStep {
  target: string;
  title: string;
  content: string;
}

export interface UserBehaviorAnalysis {
  persona: string; // ex: "Poupador", "Gastador"
  patternDescription: string;
  nextMonthProjection: number;
  tip: string;
}
