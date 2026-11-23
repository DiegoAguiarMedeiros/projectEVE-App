export interface LoginPayload {
  email: string;
  password: string;
  locale?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  locale?: string;
}

export interface LoginResponseDTO {
  accessToken?: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isRegistrationComplete?: boolean;
  isEmailVerified?: boolean;
  isAdminUser?: boolean;
}

export interface Pagination<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  data: T[];
}

export type GetAllParams = {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: "asc" | "desc";
  type?: string;
  year?: number;
  month?: number;
};

export interface Envelopes {
  id: string;
  name: string;
  color: string;
  percentage: number;
  amount?: number;
  minAmount?: number;
  used?: number;
  userId?: string;
}

export interface EnvelopesPost extends Omit<Envelopes, "id"> {}

export type TransactionsStatus =
  | "transaction.status.pending"
  | "transaction.status.completed"
  | "transaction.status.overdue"
  | "transaction.status.cancelled";

export const allTransactionsStatus: TransactionsStatus[] = [
  "transaction.status.pending",
  "transaction.status.completed",
  "transaction.status.overdue",
  "transaction.status.cancelled",
];

export type PaymentMethod =
  | "envelope.transaction.payment_method.CreditCard"
  | "envelope.transaction.payment_method.DebitCard"
  | "envelope.transaction.payment_method.Cash"
  | "envelope.transaction.payment_method.BankTransfer"
  | "envelope.transaction.payment_method.Pix"
  | "envelope.transaction.payment_method.Reallocation"
  | "envelope.transaction.payment_method.Ticket";

export const allPaymentMethod: PaymentMethod[] = [
  "envelope.transaction.payment_method.CreditCard",
  "envelope.transaction.payment_method.DebitCard",
  "envelope.transaction.payment_method.Cash",
  "envelope.transaction.payment_method.BankTransfer",
  "envelope.transaction.payment_method.Pix",
  "envelope.transaction.payment_method.Reallocation",
  "envelope.transaction.payment_method.Ticket",
];

export type TransactionsType = "Credit" | "Debit";

export const allTransactionsType: TransactionsType[] = ["Credit", "Debit"];

export interface Transactions {
  id: string;
  creditCardId?: string;
  creditCardName?: string;
  envelopeId: string;
  description: string;
  amount: string;
  paymentMethod: PaymentMethod;
  date: string | null;
  referenceYear?: number;
  referenceMonth?: number;
  type: TransactionsType;
  status: TransactionsStatus;
  isTranslatable?: boolean;
}

export interface TransactionsPost extends Omit<Transactions, "id"> {}

export interface TransactionsUpdateStatus {
  id: string;
  status: TransactionsStatus;
  creditCardName?: string;
  isTranslatable?: boolean;
}

export interface Incomes {
  id: string;
  description: string;
  amount: string;
  paymentDay: string;
}

export interface IncomesTotal {
  total: number;
}

export interface IncomesPost extends Omit<Incomes, "id"> {}

export interface ProcessedIncomes {
  id: string;
  description: string;
  month: string;
  year: string;
  day: string;
  totalIncomeProcessed: string;
  isSplitted: boolean;
  envelopeId?: string;
}

export interface ProcessedIncomesPayload extends Omit<ProcessedIncomes, "id"> {}

export interface ProcessedIncomesResponse {
  month: number;
  year: number;
  day: number;
  totalIncomeProcessed: number;
  isSplitted: boolean;
  envelopeId?: string;
}

export interface ProcessedIncomesTotal {
  total: number;
}

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ProcessedIncomesMonthResponse {
  [year: number]: Month[];
}

export interface Goals {
  id: string;
  description: string;
  amount: string | number;
  amountTotal: string | number;
  percentage: string | number;
  deadline: number;
  monthYear: boolean;
}

export interface GoalsPost extends Omit<Goals, "id"> {}

export type DebtsStatus =
  | "debt.status.pending"
  | "debt.status.paid"
  | "debt.status.overdue";

export interface Debts {
  id: string;
  envelopeId?: string;
  description: string;
  amount: string;
  installmentsTotal: string;
  installmentsPaid: string;
  paymentDay: string;
  status: DebtsStatus;
}

export interface DebtsPost extends Omit<Debts, "id"> {}

export interface DebtSummary {
  totalDebt: number;
  totalPaid: number;
  totalRemaining: number;
}

export interface FixedExpenses {
  id: string;
  envelopeId: string;
  description: string;
  amount: string;
  paymentDay: string;
  paymentMethod?: PaymentMethod;
  creditCardId?: string;
  creditCardName?: string;
}

export interface FixedExpensesPost extends Omit<FixedExpenses, "id" | "creditCardName"> {}

export type Flags =
  | "Visa"
  | "Mastercard"
  | "Elo"
  | "Hipercard"
  | "American Express"
  | "Diners Club";

export const allFlags: Flags[] = [
  "Visa",
  "Mastercard",
  "Elo",
  "Hipercard",
  "American Express",
  "Diners Club",
];

export interface CreditCards {
  id: string;
  name: string;
  flag: Flags;
  active?: boolean;
  userId?: string;
}

export interface CreditCardsPost extends Omit<CreditCards, "id" | "active" | "userId"> {}

export interface AnalyticsCurrentEnvelopes {
  labels: string[];
  colors: string[];
  values: number[];
  subValues: number[];
  pureValues: number[];
}

export interface AnalyticsEnvelopesByYear {
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
}

export interface AnalyticsEnvelopesMonthOverview {
  title: string;
  total: number;
  icon: "CallMadeIcon" | "SavingsIcon" | "SouthEastIcon" | "AttachMoneyIcon";
  color: "primary" | "secondary" | "info" | "warning" | "success" | "error";
}
