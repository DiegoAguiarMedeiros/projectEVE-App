import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAppTheme } from 'src/theme';
import { useSelectedMonthYearStore } from 'src/store/useSelectedMonthYearStore';
import { useIncomeStore } from 'src/store/useIncomeStore';
import {
  useGetUpcomingPendingPayments,
  useListAnalyticsCurrentEnvelopes,
  useListAnalyticsEnvelopesByYear,
  useListAnalyticsEnvelopesMonthOverview,
  useListCreditCards,
  useListEnvelopesWithAmount,
  useProcessAllIncomes,
  useUpdateTransactions,
} from 'src/hooks/useApi';
import { AppButton } from 'src/components/FormElements';
import { ProcessedIncomeFormModal, TransactionFormModal } from 'src/components/FormModals';
import { ItemRow } from 'src/components/ItemRow';
import { allPaymentMethod, PaymentMethod, Transactions } from 'src/types';
import { fDate, fNumberToCurrency, fShortenNumber, hexWithAlpha } from 'src/utils/format';

// ─── Pie Chart SVG Helper ─────────────────────────────────────────────────────

const SimpleDonutChart: React.FC<{
  values: number[];
  colors: string[];
  size?: number;
}> = ({ values, colors, size = 190 }) => {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 22;
  const circumference = 2 * Math.PI * r;

  let cumulativeFraction = 0;

  return (
    <View style={{ alignItems: 'center', marginVertical: 14 }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          {values.map((val, idx) => {
            const fraction = val / total;
            const strokeDasharray = `${fraction * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativeFraction * circumference;
            cumulativeFraction += fraction;

            return (
              <Circle
                key={idx}
                cx={cx}
                cy={cy}
                r={r}
                stroke={colors[idx] || '#1877F2'}
                strokeWidth={28}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                fill="transparent"
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

// ─── Yearly Grouped Bar Chart SVG Helper ──────────────────────────────────────

const YearlyBarChart: React.FC<{
  categories: string[];
  series: { name: string; data: number[] }[];
}> = ({ categories, series }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const barColors = [
    colors.primary.main,
    colors.info.main,
    colors.error.main,
    colors.success.main,
  ];

  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues, 1);

  const chartHeight = 170;
  const groupWidth = 48;
  const chartWidth = Math.max(categories.length * groupWidth + 40, 320);

  return (
    <View>
      <View style={styles.legendRow}>
        {series.map((s, idx) => (
          <View key={s.name} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: barColors[idx % barColors.length] },
              ]}
            />
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>
              {t(s.name)}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartWidth} height={chartHeight + 30}>
          <Line
            x1={10}
            y1={chartHeight}
            x2={chartWidth - 10}
            y2={chartHeight}
            stroke={colors.divider}
            strokeWidth={1}
          />
          {categories.map((cat, mIdx) => {
            const baseX = 20 + mIdx * groupWidth;
            return (
              <G key={cat}>
                {series.map((s, sIdx) => {
                  const val = Math.max(0, s.data[mIdx] || 0);
                  const h = (val / maxVal) * (chartHeight - 20);
                  const barX = baseX + sIdx * 9;
                  const barY = chartHeight - h;
                  return (
                    <Rect
                      key={s.name}
                      x={barX}
                      y={barY}
                      width={7}
                      height={Math.max(h, 2)}
                      rx={2}
                      fill={barColors[sIdx % barColors.length]}
                    />
                  );
                })}
                <SvgText
                  x={baseX + 16}
                  y={chartHeight + 18}
                  fontSize="10"
                  fill={colors.text.secondary}
                  textAnchor="middle"
                >
                  {t(cat)}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

export const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { month, year, hasMonthProcessed } = useSelectedMonthYearStore();
  const income = useIncomeStore((s) => s.income);

  const processAllMutation = useProcessAllIncomes();
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);

  const { data: envelopes = [] } = useListEnvelopesWithAmount(year, month);
  const { data: overviewCards = [] } = useListAnalyticsEnvelopesMonthOverview(year, month);
  const { data: currentEnvelopesGraph } = useListAnalyticsCurrentEnvelopes(year, month);
  const { data: yearGraph } = useListAnalyticsEnvelopesByYear(year);
  const { data: upcomingData } = useGetUpcomingPendingPayments(year, month);
  const { data: creditCardsData } = useListCreditCards();
  const creditCards = creditCardsData?.data ?? [];

  const updateTransactionMutation = useUpdateTransactions();

  const [payingTx, setPayingTx] = useState<Transactions | null>(null);
  const [editingTx, setEditingTx] = useState<Transactions | null>(null);
  const [selectingCardForTx, setSelectingCardForTx] = useState(false);

  const monthKeys = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
  const monthName = t(`months.${monthKeys[month - 1]}`);

  if (!hasMonthProcessed) {
    return (
      <View
        style={[
          styles.unprocessedContainer,
          { backgroundColor: colors.background.default },
        ]}
      >
        <View
          style={[
            styles.unprocessedCard,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          <MaterialIcons
            name="account-balance-wallet"
            size={52}
            color={colors.primary.main}
            style={{ marginBottom: 14 }}
          />
          <Text style={[styles.unprocessedTitle, { color: colors.text.primary }]}>
            {t('home.no_envelopes_title')}
          </Text>
          <Text
            style={[
              styles.unprocessedDesc,
              { color: colors.text.secondary },
            ]}
          >
            {t('home.no_envelopes_not_processed')}
          </Text>
          <AppButton
            title={t('home.process_button', { month: monthName, year })}
            loading={processAllMutation.isPending}
            onPress={() => {
              if (!income || income <= 0) {
                setIncomeModalOpen(true);
              } else {
                processAllMutation.mutate({ month, year });
              }
            }}
            style={{ marginTop: 18, width: '100%' }}
          />
        </View>

        <ProcessedIncomeFormModal
          visible={incomeModalOpen}
          onClose={() => setIncomeModalOpen(false)}
          envelopes={envelopes}
          fixedMonth={month}
          fixedYear={year}
        />
      </View>
    );
  }

  const goalsEnvelopeId = envelopes.find((e) => e.name === 'goals')?.id;
  const upcomingItems = (upcomingData?.data ?? []).filter(
    (tx) => tx.envelopeId !== goalsEnvelopeId
  );

  const getIconName = (
    icon: string
  ): keyof typeof MaterialIcons.glyphMap => {
    switch (icon) {
      case 'CallMadeIcon':
        return 'call-made';
      case 'SavingsIcon':
        return 'savings';
      case 'SouthEastIcon':
        return 'south-east';
      case 'AttachMoneyIcon':
      default:
        return 'attach-money';
    }
  };

  const selectablePaymentMethods = allPaymentMethod.filter((m) => {
    if (m === 'envelope.transaction.payment_method.Reallocation') return false;
    if (
      m === 'envelope.transaction.payment_method.CreditCard' &&
      creditCards.length === 0
    ) {
      return false;
    }
    return true;
  });

  const handleMarkAsPaid = (
    tx: Transactions,
    paymentMethod: PaymentMethod,
    creditCardId?: string
  ) => {
    updateTransactionMutation.mutate({
      ...tx,
      status: 'transaction.status.completed',
      paymentMethod,
      creditCardId: creditCardId ?? undefined,
    });
    setPayingTx(null);
    setSelectingCardForTx(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.default }]}
      contentContainerStyle={styles.content}
    >
      {/* 1. 4 Overview Cards (2x2 Grid) */}
      <View style={styles.cardsGrid}>
        {overviewCards.map((item, idx) => {
          const paletteColor =
            (colors as any)[item.color]?.main || colors.primary.main;
          return (
            <View
              key={idx}
              style={[
                styles.overviewCard,
                {
                  backgroundColor: colors.background.paper,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.overviewCardTop}>
                <MaterialIcons
                  name={getIconName(item.icon)}
                  size={20}
                  color={paletteColor}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.overviewCardTitle, { color: paletteColor }]}
                >
                  {t(item.title)}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.overviewCardValue, { color: paletteColor }]}
              >
                {fNumberToCurrency(item.total)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 2. Current Envelopes Pie + Progress Legends */}
      {currentEnvelopesGraph && currentEnvelopesGraph.pureValues.length > 0 && (
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardHeaderTitle, { color: colors.text.primary }]}>
            {t('overview.envelopes_title')}
          </Text>

          <SimpleDonutChart
            values={currentEnvelopesGraph.pureValues}
            colors={currentEnvelopesGraph.colors}
          />

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={{ gap: 12 }}>
            {currentEnvelopesGraph.labels.map((label, idx) => {
              const pureValue = currentEnvelopesGraph.pureValues[idx] || 0;
              const subVal = currentEnvelopesGraph.subValues[idx] || 0;
              const envColor = currentEnvelopesGraph.colors[idx] || colors.primary.main;
              const amountToGo = (pureValue * (100 - subVal)) / 100;

              return (
                <View key={idx}>
                  <View style={styles.envLegendHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: envColor },
                        ]}
                      />
                      <Text
                        style={{
                          fontWeight: '700',
                          color: colors.text.primary,
                          fontSize: 13,
                        }}
                      >
                        {t(label)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                      {amountToGo <= 0
                        ? t('overview.envelopes.no_funds')
                        : t('overview.envelopes.available', {
                            amount: fNumberToCurrency(amountToGo),
                          })}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: hexWithAlpha(envColor, 0.2) },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, Math.max(0, subVal))}%`,
                          backgroundColor: envColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 3. Annual Budget Bar Chart */}
      {yearGraph && (
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardHeaderTitle, { color: colors.text.primary }]}>
            {t('overview.budget')}
          </Text>
          <YearlyBarChart
            categories={yearGraph.categories}
            series={yearGraph.series}
          />
        </View>
      )}

      {/* 4. Upcoming Pending Payments ("Avisos") */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardHeaderTitle, { color: colors.text.primary }]}>
          {t('overview.upcoming_payments.title')}
        </Text>

        {upcomingItems.length === 0 ? (
          <Text
            style={{
              textAlign: 'center',
              color: colors.text.secondary,
              paddingVertical: 20,
            }}
          >
            {t('overview.upcoming_payments.empty')}
          </Text>
        ) : (
          upcomingItems.map((tx, idx) => {
            const envName =
              envelopes.find((e) => e.id === tx.envelopeId)?.name || '';
            const isOverdue =
              tx.status === 'transaction.status.pending' &&
              !!tx.date &&
              dayjs(tx.date).isBefore(dayjs(), 'day');
            const displayStatus = isOverdue
              ? 'transaction.status.overdue'
              : tx.status;

            return (
              <ItemRow
                key={tx.id}
                hideDivider={idx === upcomingItems.length - 1}
                avatarBg={colors.error.lighter}
                avatarIcon="arrow-upward"
                avatarIconColor={colors.error.main}
                title={tx.isTranslatable ? t(tx.description) : tx.description}
                subtitle={
                  <>
                    <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                      {t(envName)} • {fDate(tx.date)}
                    </Text>
                    <View
                      style={[
                        styles.statusChip,
                        {
                          borderColor: isOverdue
                            ? colors.error.main
                            : colors.warning.main,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: isOverdue
                            ? colors.error.main
                            : colors.warning.main,
                        }}
                      >
                        {t(displayStatus)}
                      </Text>
                    </View>
                  </>
                }
                amount={
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.error.main,
                    }}
                  >
                    {fNumberToCurrency(tx.amount)}
                  </Text>
                }
                inlineAction={
                  tx.status !== 'transaction.status.completed' ? (
                    <TouchableOpacity
                      style={[
                        styles.payBtn,
                        { backgroundColor: colors.success.main },
                      ]}
                      onPress={() => {
                        setPayingTx(tx);
                        setSelectingCardForTx(false);
                      }}
                    >
                      <Text
                        style={{ color: '#FFF', fontWeight: '700', fontSize: 11 }}
                      >
                        {t('common.pay')}
                      </Text>
                    </TouchableOpacity>
                  ) : undefined
                }
                onPress={() => setEditingTx(tx)}
              />
            );
          })
        )}
      </View>

      {/* Mark As Paid Payment Method Modal */}
      <Modal
        visible={!!payingTx}
        transparent
        animationType="fade"
        onRequestClose={() => setPayingTx(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPayingTx(null)}
        >
          <View
            style={[
              styles.payModalCard,
              { backgroundColor: colors.background.paper, borderColor: colors.border },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: colors.text.primary,
                marginBottom: 12,
              }}
            >
              {selectingCardForTx
                ? t('envelope.transaction.payment_method.CreditCard')
                : t('envelope.transaction.payment_method_label')}
            </Text>

            {selectingCardForTx ? (
              creditCards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.methodItem,
                    { borderBottomColor: colors.divider },
                  ]}
                  onPress={() =>
                    payingTx &&
                    handleMarkAsPaid(
                      payingTx,
                      'envelope.transaction.payment_method.CreditCard',
                      card.id
                    )
                  }
                >
                  <MaterialIcons
                    name="credit-card"
                    size={20}
                    color={colors.primary.main}
                  />
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontWeight: '600',
                      marginLeft: 10,
                    }}
                  >
                    {card.name} ({card.flag})
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              selectablePaymentMethods.map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodItem,
                    { borderBottomColor: colors.divider },
                  ]}
                  onPress={() => {
                    if (
                      method === 'envelope.transaction.payment_method.CreditCard'
                    ) {
                      setSelectingCardForTx(true);
                    } else if (payingTx) {
                      handleMarkAsPaid(payingTx, method);
                    }
                  }}
                >
                  <MaterialIcons
                    name="payment"
                    size={20}
                    color={colors.primary.main}
                  />
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontWeight: '600',
                      marginLeft: 10,
                      flex: 1,
                    }}
                  >
                    {t(method)}
                  </Text>
                  {method ===
                    'envelope.transaction.payment_method.CreditCard' && (
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={colors.text.secondary}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <TransactionFormModal
          visible={!!editingTx}
          onClose={() => setEditingTx(null)}
          envelopeId={editingTx.envelopeId}
          data={editingTx}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
    gap: 16,
  },
  unprocessedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unprocessedCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  unprocessedTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  unprocessedDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  overviewCard: {
    width: '48%',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  overviewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  overviewCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  overviewCardValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  envLegendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  payBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  payModalCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
