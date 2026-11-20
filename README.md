# Project EVE — Mobile App (`projectEVE-App`)

Aplicativo mobile do **Project EVE** (Gestão Financeira Pessoal e Orçamento por Envelopes), desenvolvido com **React Native 0.81 (New Architecture)**, **React 19**, **Expo SDK 54**, **TypeScript 5.8**, **TanStack React Query v5**, **Zustand v5** e **i18next** (`pt-BR`, `en`, `es`).

## Funcionalidades e Integração 100% com o `projectEVE-backend`

- **Autenticação Completa (`/api/auth` & `/api/users`):**
  - Login (`SignInScreen`) com redirecionamento automático para verificação de e-mail pendente (`auth.errors.email_not_verified`) e suporte híbrido a Cookies HTTP-only + Bearer Token (`Authorization`).
  - Cadastro (`RegistrationScreen`) com modal de confirmação.
  - Verificação de E-mail (`VerifyEmailScreen`).
  - Esqueci Minha Senha (`ForgotPasswordScreen`) e Redefinição de Senha (`ResetPasswordScreen`).
- **Onboarding Obrigatório (`CompleteRegistrationScreen`):**
  - Fluxo em 6 etapas (Renda, Contas Fixas, Dívidas, Cartões de Crédito, Metas e Limites/Envelopes) com validação obrigatória de 100% de alocação nos envelopes antes de liberar `POST /api/users/complete-registration`.
- **Seletor Global de Mês/Ano (`MonthYearPickerHeader`):**
  - Navegação rápida entre meses, visualização de meses já processados (`GET /api/processed-incomes/months`) e exclusão de mês processado (`DELETE /api/processed-incomes/:year/:month`).
- **Orçamento / Dashboard (`DashboardScreen`):**
  - Estado de mês não processado com botão **"Processar Mês/Ano"** (`POST /api/processed-incomes/process-all` ou modal de renda avulsa se o usuário não tiver salário base).
  - 4 Cards de resumo mensal (`GET /api/graph/analytics-envelopes-month-overview/:year/:month`).
  - Gráfico Donut SVG de distribuição dos envelopes + barras de progresso e saldo disponível (`GET /api/graph/analytics-current-envelopes/:year/:month`).
  - Gráfico anual de barras agrupadas (`GET /api/graph/analytics-envelopes-by-year/:year`).
  - Lista de **Avisos / Pagamentos Pendentes** (`GET /api/transactions/upcoming-pending`) com botão **"Pagar"** permitindo selecionar o método de pagamento e cartão de crédito.
- **Envelopes e Transações (`EnvelopesScreen` & `ReallocationScreen`):**
  - Carrossel horizontal de envelopes geométricos renderizados em SVG (`RealEnvelopeCard`) com contraste automático YIQ e barra de progresso.
  - Lista de transações agrupadas por data ("Hoje", "Ontem", data formatada), filtro por Todos / Saída / Entrada, toggle rápido de status Pago/Pendente (`PATCH /api/transactions/:id/change-status`) e CRUD completo.
  - Tela de **Realocação / Transferência de Saldo** entre envelopes (`POST /api/envelopes/transfer`).
- **Minha Renda (`ProcessedIncomesScreen`):**
  - Total processado no mês e lista de entradas processadas com opção de dividir entre todos os envelopes (`isSplitted: true`) ou alocar em um envelope único.
- **Metas (`GoalsScreen`):**
  - Cards de Saldo do Envelope Acumulado (`useEffectiveGoalsCumulative`), Total das Metas e Faltam.
  - Calculadora em tempo real de recomendação de metas (quanto guardar por mês, % do envelope e renda ideal).
  - Modal de **Evolução da Meta** com gráfico de área/linha SVG.
- **Dívidas (`DebtsScreen`):**
  - Cards de Total das Dívidas, Total Pago e Total Restante com projeção dinâmica por mês/ano (`getEffectivePaidInstallments`).
  - Modal detalhado de **Parcelas** (`#1..#N` com status Paga, Atual e Futura) e modal de **Evolução da Dívida**.
- **Configurações (`SettingsScreen`) e Perfil (`ProfileScreen`):**
  - 6 abas de configuração: Meu Salário, Meus Limites, Minhas Metas, Minhas Contas Fixas, Minhas Dívidas e Meus Cartões.
  - Edição de perfil, alteração de senha, tema Claro/Escuro, idioma (`pt-BR`, `en`, `es`), moeda (`BRL`, `USD`, `EUR`), formato numérico (`1.000,00` vs `1,000.00`), formato de data (`DD/MM/YYYY` vs `MM/DD/YYYY`), notificações e exclusão de conta.

## Como Executar

1. Instale as dependências:
   ```bash
   cd projectEVE-App
   npm install
   ```
2. Configure a URL da API no arquivo `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000/api
   ```
3. Inicie o servidor Expo:
   ```bash
   npx expo start
   ```
