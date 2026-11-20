import { api, clearAuthTokens, saveAuthTokens } from '../client';
import {
  AnalyticsCurrentEnvelopes,
  AnalyticsEnvelopesByYear,
  AnalyticsEnvelopesMonthOverview,
  CreditCards,
  CreditCardsPost,
  Debts,
  DebtsPost,
  DebtSummary,
  Envelopes,
  EnvelopesPost,
  FixedExpenses,
  FixedExpensesPost,
  GetAllParams,
  Goals,
  GoalsPost,
  Incomes,
  IncomesPost,
  IncomesTotal,
  LoginPayload,
  LoginResponseDTO,
  Pagination,
  ProcessedIncomes,
  ProcessedIncomesMonthResponse,
  ProcessedIncomesPayload,
  ProcessedIncomesResponse,
  ProcessedIncomesTotal,
  RegisterPayload,
  Transactions,
  TransactionsPost,
  TransactionsUpdateStatus,
  User,
} from 'src/types';

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const login = async (payload: LoginPayload): Promise<LoginResponseDTO> => {
  const res = await api.post<LoginResponseDTO>('/auth/login', payload);
  if (res.data?.accessToken) {
    await saveAuthTokens(res.data.accessToken, res.data.refreshToken);
  }
  return res.data;
};

export const register = (payload: RegisterPayload) => api.post('/auth', payload);

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    await clearAuthTokens();
  }
};

export const verifyEmail = (token: string) =>
  api.get('/auth/verify-email', { params: { token } });

export const forgotPassword = (email: string, locale?: string) =>
  api.post('/auth/forgot-password', { email, locale });

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });

// ─── User Service ─────────────────────────────────────────────────────────────

export const getUser = () => api.get<User>('/users/me');

export const updateProfile = (payload: { name: string }) =>
  api.put('/users/profile', payload);

export const changePassword = (payload: { currentPassword: string; newPassword: string }) =>
  api.put('/users/change-password', payload);

export const completeRegistration = () => api.post('/users/complete-registration');

export const deleteAccount = async () => {
  const res = await api.delete('/users/me');
  await clearAuthTokens();
  return res;
};

// ─── Envelopes Service ────────────────────────────────────────────────────────

export const listEnvelopes = () => api.get<Envelopes[]>('/envelopes');

export const listWithAmount = (year: number, month: number) =>
  api.get<Envelopes[]>(`/envelopes/${year}/${month}`);

export const createEnvelopes = (payload: EnvelopesPost) =>
  api.post<Envelopes>('/envelopes', payload);

export const updateEnvelopes = (payload: Envelopes) =>
  api.patch<Envelopes>(`/envelopes/${payload.id}`, payload);

export const deleteEnvelopes = (id: string) => api.delete(`/envelopes/${id}`);

export const transferEnvelopeBalance = (payload: {
  fromEnvelopeId: string;
  toEnvelopeId: string;
  amount: number;
  year: number;
  month: number;
}) => api.post('/envelopes/transfer', payload);

// ─── Transactions Service ─────────────────────────────────────────────────────

export const listTransactionsByEnvelope = (
  envelopeId: string,
  year: number,
  month: number,
  params?: GetAllParams
) =>
  api.get<Pagination<Transactions>>(
    `/transactions/envelope/${year}/${month}/${envelopeId}`,
    { params }
  );

export const getUpcomingPendingPayments = (params?: GetAllParams) =>
  api.get<Pagination<Transactions>>('/transactions/upcoming-pending', { params });

export const createTransactions = (payload: TransactionsPost) =>
  api.post<Transactions>('/transactions', payload);

export const updateTransactions = (payload: Transactions) =>
  api.put<Transactions>(`/transactions/${payload.id}`, payload);

export const updateStatusTransactions = (payload: TransactionsUpdateStatus) =>
  api.patch<Transactions>(`/transactions/${payload.id}/change-status`, payload);

export const deleteTransactions = (id: string) => api.delete(`/transactions/${id}`);

export const deleteAllTransactionsByEnvelope = (
  envelopeId: string,
  year: number,
  month: number
) => api.delete(`/transactions/envelope/${year}/${month}/${envelopeId}`);

// ─── Incomes Service ──────────────────────────────────────────────────────────

export const listIncomes = (params?: GetAllParams) =>
  api.get<Pagination<Incomes>>('/incomes', { params });

export const listTotalIncomes = () => api.get<IncomesTotal>('/incomes/total');

export const createIncomes = (payload: IncomesPost) =>
  api.post<Incomes>('/incomes', payload);

export const updateIncomes = (payload: Incomes) =>
  api.patch<Incomes>(`/incomes/${payload.id}`, payload);

export const deleteIncomes = (id: string) => api.delete(`/incomes/${id}`);

export const deleteAllIncomes = (ids: string[]) =>
  api.delete('/incomes/delete-all', { data: { ids } });

// ─── Processed Incomes Service ────────────────────────────────────────────────

export const processAll = (payload: { month: number; year: number }) =>
  api.post('/processed-incomes/process-all', payload);

export const processIncome = (payload: ProcessedIncomesPayload) =>
  api.post<ProcessedIncomesResponse>('/processed-incomes', payload);

export const processedIncomes = (year: number, month: number, params?: GetAllParams) =>
  api.get<Pagination<ProcessedIncomes>>(`/processed-incomes/${year}/${month}`, { params });

export const getTotalProcessedIncomes = (year: number, month: number) =>
  api.get<ProcessedIncomesTotal>(`/processed-incomes/total/${year}/${month}`);

export const processedIncomesMonth = () =>
  api.get<ProcessedIncomesMonthResponse>('/processed-incomes/months');

export const updateProcessedIncomes = (payload: ProcessedIncomes) =>
  api.put<ProcessedIncomes>(`/processed-incomes/${payload.id}`, payload);

export const deleteProcessedIncome = (id: string) =>
  api.delete(`/processed-incomes/${id}`);

export const deleteAllProcessedIncomes = (ids: string[]) =>
  api.delete('/processed-incomes/delete-all', { data: { ids } });

export const deleteProcessedIncomesByMonth = (year: number, month: number) =>
  api.delete(`/processed-incomes/${year}/${month}`);

// ─── Goals Service ────────────────────────────────────────────────────────────

export const listGoals = (params?: GetAllParams) =>
  api.get<Pagination<Goals>>('/goals', { params });

export const createGoals = (payload: GoalsPost) => api.post<Goals>('/goals', payload);

export const updateGoals = (payload: Goals) =>
  api.patch<Goals>(`/goals/${payload.id}`, payload);

export const deleteGoals = (id: string) => api.delete(`/goals/${id}`);

export const deleteAllGoals = (ids: string[]) =>
  api.delete('/goals/delete-all', { data: { ids } });

// ─── Debts Service ────────────────────────────────────────────────────────────

export const listDebts = (params?: GetAllParams) =>
  api.get<Pagination<Debts>>('/debts', { params });

export const getDebtSummary = (month: number, year: number) =>
  api.get<DebtSummary>('/debts/summary', { params: { month, year } });

export const createDebts = (payload: DebtsPost) => api.post<Debts>('/debts', payload);

export const updateDebts = (payload: Debts) =>
  api.patch<Debts>(`/debts/${payload.id}`, payload);

export const deleteDebts = (id: string) => api.delete(`/debts/${id}`);

export const deleteAllDebts = (ids: string[]) =>
  api.delete('/debts/delete-all', { data: { ids } });

// ─── Fixed Expenses Service ───────────────────────────────────────────────────

export const listFixedExpenses = (params?: GetAllParams) =>
  api.get<Pagination<FixedExpenses>>('/fixed-expenses', { params });

export const createFixedExpenses = (payload: FixedExpensesPost) =>
  api.post<FixedExpenses>('/fixed-expenses', payload);

export const updateFixedExpenses = (payload: FixedExpenses) =>
  api.patch<FixedExpenses>(`/fixed-expenses/${payload.id}`, payload);

export const deleteFixedExpenses = (id: string) =>
  api.delete(`/fixed-expenses/${id}`);

export const deleteAllFixedExpenses = (ids: string[]) =>
  api.delete('/fixed-expenses/delete-all', { data: { ids } });

// ─── Credit Cards Service ─────────────────────────────────────────────────────

export const listCreditCards = (params?: GetAllParams) =>
  api.get<Pagination<CreditCards>>('/credit-cards', { params });

export const createCreditCards = (payload: CreditCardsPost) =>
  api.post<CreditCards>('/credit-cards', payload);

export const updateCreditCards = (payload: CreditCards) =>
  api.patch<CreditCards>(`/credit-cards/${payload.id}`, payload);

export const deleteCreditCards = (id: string) =>
  api.delete(`/credit-cards/${id}`);

export const deleteAllCreditCards = (ids: string[]) =>
  api.delete('/credit-cards/delete-all', { data: { ids } });

// ─── Graph Service ────────────────────────────────────────────────────────────

export const listAnalyticsCurrentEnvelopes = (year: number, month: number) =>
  api.get<AnalyticsCurrentEnvelopes>(
    `/graph/analytics-current-envelopes/${year}/${month}`
  );

export const listAnalyticsEnvelopesMonthOverview = (year: number, month: number) =>
  api.get<AnalyticsEnvelopesMonthOverview[]>(
    `/graph/analytics-envelopes-month-overview/${year}/${month}`
  );

export const listAnalyticsEnvelopesByYear = (year: number) =>
  api.get<AnalyticsEnvelopesByYear>(`/graph/analytics-envelopes-by-year/${year}`);

export const getGoalsCumulativeAmount = (year: number, month: number) =>
  api.get<number>(`/graph/goals-cumulative/${year}/${month}`);
