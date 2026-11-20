import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { useSelectedMonthYearStore } from 'src/store/useSelectedMonthYearStore';
import {
  useDeleteDebts,
  useDeleteGoals,
  useEffectiveGoalsCumulative,
  useHasGoals,
  useListDebts,
  useListEnvelopesWithAmount,
  useListGoals,
} from 'src/hooks/useApi';
import { ItemRow } from 'src/components/ItemRow';
import { DebtFormModal, GoalFormModal } from 'src/components/FormModals';
import { Debts, Goals } from 'src/types';
import {
  fCurrency,
  formatGoalDeadline,
  getCurrencyConfig,
  getEffectivePaidInstallments,
  getGoalDeadlineInMonths,
  getInstallmentDate,
  hexWithAlpha,
} from 'src/utils/format';

// ─── SVG Evolution Line/Area Chart ────────────────────────────────────────────

const EvolutionLineChart: React.FC<{
  categories: string[];
  primaryData: number[];
  secondaryData?: number[];
  primaryColor: string;
  secondaryColor?: string;
  currentCategory?: string;
}> = ({
  categories,
  primaryData,
  secondaryData,
  primaryColor,
  secondaryColor,
  currentCategory,
}) => {
  const { colors } = useAppTheme();
  const allVals = [...primaryData, ...(secondaryData || [])];
  const maxVal = Math.max(...allVals, 1);

  const chartHeight = 200;
  const stepX = 52;
  const chartWidth = Math.max(categories.length * stepX + 40, 320);

  const getPoints = (data: number[]) =>
    data
      .map((val, idx) => {
        const x = 24 + idx * stepX;
        const y = chartHeight - (Math.max(0, val) / maxVal) * (chartHeight - 28);
        return `${x},${y}`;
      })
      .join(' ');

  const primaryPoints = getPoints(primaryData);
  const firstX = 24;
  const lastX = 24 + Math.max(0, primaryData.length - 1) * stepX;
  const areaPoints = `${firstX},${chartHeight} ${primaryPoints} ${lastX},${chartHeight}`;

  const currentIdx = currentCategory ? categories.indexOf(currentCategory) : -1;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={chartWidth} height={chartHeight + 34}>
        <Line
          x1={14}
          y1={chartHeight}
          x2={chartWidth - 14}
          y2={chartHeight}
          stroke={colors.divider}
          strokeWidth={1}
        />

        {primaryData.length > 1 && (
          <>
            <Polygon
              points={areaPoints}
              fill={hexWithAlpha(primaryColor, 0.2)}
            />
            <Polyline
              points={primaryPoints}
              fill="none"
              stroke={primaryColor}
              strokeWidth={3}
            />
          </>
        )}

        {secondaryData && secondaryData.length > 1 && secondaryColor && (
          <Polyline
            points={getPoints(secondaryData)}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}

        {currentIdx >= 0 && (
          <Line
            x1={24 + currentIdx * stepX}
            y1={10}
            x2={24 + currentIdx * stepX}
            y2={chartHeight}
            stroke={colors.info.main}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
        )}

        {primaryData.map((val, idx) => {
          const x = 24 + idx * stepX;
          const y =
            chartHeight - (Math.max(0, val) / maxVal) * (chartHeight - 28);
          return (
            <React.Fragment key={idx}>
              <Circle cx={x} cy={y} r={4} fill={primaryColor} />
              <SvgText
                x={x}
                y={chartHeight + 18}
                fontSize="10"
                fill={colors.text.secondary}
                textAnchor="middle"
              >
                {categories[idx]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </ScrollView>
  );
};

// ─── 1. Goals Screen ("Metas") ────────────────────────────────────────────────

export const GoalsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const safeBottom =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 48 : 16;
  const { month, year } = useSelectedMonthYearStore();

  const { data: goalsData } = useListGoals();
  const { goalsEnvelope } = useHasGoals(year, month);
  const cumulativeTotal = useEffectiveGoalsCumulative(year, month);
  const deleteMutation = useDeleteGoals();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goals | null>(null);
  const [evolutionGoal, setEvolutionGoal] = useState<Goals | null>(null);

  const items = goalsData?.data ?? [];
  const totalAmountTotal = items.reduce(
    (sum, g) => sum + Number(g.amountTotal),
    0
  );
  const totalSaved = items.reduce(
    (sum, g) => sum + cumulativeTotal * (Number(g.percentage) / 100),
    0
  );
  const remaining = Math.max(0, totalAmountTotal - totalSaved);

  // Evolution Modal computation
  const renderGoalEvolutionModal = () => {
    if (!evolutionGoal) return null;
    const saved = cumulativeTotal * (Number(evolutionGoal.percentage) / 100);
    const amountTotal = Number(evolutionGoal.amountTotal);
    const deadlineInMonths = getGoalDeadlineInMonths(
      evolutionGoal.deadline,
      evolutionGoal.monthYear
    );
    const mesesPassados =
      amountTotal > 0 ? Math.round((saved / amountTotal) * deadlineInMonths) : 0;
    const valorMensal = mesesPassados > 0 ? saved / mesesPassados : 0;

    const displayedMonths = Math.min(Math.max(deadlineInMonths, 1), 12);
    const startMonth = month - 1 - mesesPassados;

    const categories = Array.from({ length: displayedMonths + 1 }, (_, i) => {
      const d = new Date(year, startMonth + i, 1);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}/${yy}`;
    });
    const savedData = Array.from({ length: displayedMonths + 1 }, (_, i) =>
      Math.min(valorMensal * i, amountTotal)
    );
    const targetData = Array.from(
      { length: displayedMonths + 1 },
      () => amountTotal
    );
    const currentAnnotation =
      mesesPassados <= displayedMonths ? categories[mesesPassados] : undefined;

    return (
      <Modal
        visible={!!evolutionGoal}
        transparent
        animationType="slide"
        onRequestClose={() => setEvolutionGoal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.fullModalCard,
              {
                backgroundColor: colors.background.paper,
                borderColor: colors.border,
                paddingBottom: 24 + safeBottom,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: colors.text.primary,
                  }}
                >
                  {evolutionGoal.description}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                  {t('goals_page.evolution_modal.title')} —{' '}
                  {fCurrency(amountTotal)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEvolutionGoal(null)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <EvolutionLineChart
                categories={categories}
                primaryData={savedData}
                secondaryData={targetData}
                primaryColor={colors.success.main}
                secondaryColor={colors.warning.main}
                currentCategory={currentAnnotation}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 3 Summary Cards */}
        <View
          style={[
            styles.summaryBox,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          <Text style={{ fontSize: 12, color: colors.text.secondary }}>
            {t('goals_page.summary.envelope_balance')}
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: colors.text.primary,
              marginTop: 2,
            }}
          >
            {fCurrency(cumulativeTotal)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryHalfBox,
              {
                backgroundColor: hexWithAlpha(colors.info.main, 0.12),
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>
              {t('goals_page.summary.total_goals')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: colors.info.main,
                marginTop: 2,
              }}
            >
              {fCurrency(totalAmountTotal)}
            </Text>
          </View>

          <View
            style={[
              styles.summaryHalfBox,
              {
                backgroundColor: hexWithAlpha(colors.warning.main, 0.12),
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>
              {t('goals_page.summary.remaining')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: colors.warning.main,
                marginTop: 2,
              }}
            >
              {fCurrency(remaining)}
            </Text>
          </View>
        </View>

        {/* Goals List */}
        <View
          style={[
            styles.listCard,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          {items.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {t('goals_page.table.empty')}
            </Text>
          ) : (
            items.map((goal, idx) => {
              const saved = cumulativeTotal * (Number(goal.percentage) / 100);
              const progress =
                Number(goal.amountTotal) > 0
                  ? Math.min(
                      Math.round((saved / Number(goal.amountTotal)) * 100),
                      100
                    )
                  : 0;

              return (
                <ItemRow
                  key={goal.id}
                  hideDivider={idx === items.length - 1}
                  avatarBg={colors.primary.lighter}
                  avatarIcon="savings"
                  avatarIconColor={colors.primary.main}
                  title={goal.description}
                  subtitle={
                    <>
                      <View
                        style={[
                          styles.badgeChip,
                          {
                            borderColor:
                              progress >= 100
                                ? colors.success.main
                                : colors.info.main,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color:
                              progress >= 100
                                ? colors.success.main
                                : colors.info.main,
                          }}
                        >
                          {progress}%
                        </Text>
                      </View>
                      <Text
                        style={{ fontSize: 12, color: colors.text.secondary }}
                      >
                        {fCurrency(saved)} / {fCurrency(goal.amountTotal)} •{' '}
                        {formatGoalDeadline(t, goal.deadline, goal.monthYear)}
                      </Text>
                    </>
                  }
                  amount={
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: colors.primary.main,
                      }}
                    >
                      {fCurrency(goal.amountTotal)}
                    </Text>
                  }
                  menuActions={[
                    {
                      label: t('common.edit'),
                      iconName: 'edit',
                      onPress: () => {
                        setEditingGoal(goal);
                        setFormOpen(true);
                      },
                    },
                    {
                      label: t('goals_page.actions.view_evolution'),
                      iconName: 'show-chart',
                      onPress: () => setEvolutionGoal(goal),
                    },
                    {
                      label: t('common.delete'),
                      iconName: 'delete',
                      color: 'error',
                      onPress: () => deleteMutation.mutate(goal.id),
                    },
                  ]}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary.main }]}
        onPress={() => {
          setEditingGoal(null);
          setFormOpen(true);
        }}
      >
        <MaterialIcons name="add" size={26} color="#FFF" />
      </TouchableOpacity>

      <GoalFormModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        data={editingGoal}
        envelope={goalsEnvelope}
      />

      {renderGoalEvolutionModal()}
    </View>
  );
};

// ─── 2. Debts Screen ("Dívidas") ──────────────────────────────────────────────

export const DebtsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const safeBottom =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 48 : 16;
  const { month, year } = useSelectedMonthYearStore();

  const { data: debtsData } = useListDebts();
  const { data: envelopes = [] } = useListEnvelopesWithAmount(year, month);
  const deleteMutation = useDeleteDebts();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debts | null>(null);
  const [installmentsDebt, setInstallmentsDebt] = useState<Debts | null>(null);
  const [evolutionDebt, setEvolutionDebt] = useState<Debts | null>(null);

  const allItems = debtsData?.data ?? [];

  const totalDebt = allItems.reduce(
    (sum, d) => sum + Number(d.amount) * Number(d.installmentsTotal),
    0
  );
  const totalPaid = allItems.reduce((sum, d) => {
    const effPaid = getEffectivePaidInstallments(
      Number(d.installmentsPaid),
      Number(d.installmentsTotal),
      month,
      year
    );
    return sum + Number(d.amount) * effPaid;
  }, 0);
  const totalRemaining = Math.max(0, totalDebt - totalPaid);

  const activeDebts = allItems.filter(
    (d) =>
      getEffectivePaidInstallments(
        Number(d.installmentsPaid),
        Number(d.installmentsTotal),
        month,
        year
      ) < Number(d.installmentsTotal)
  );

  // Installments Modal
  const renderInstallmentsModal = () => {
    if (!installmentsDebt) return null;
    const amount = Number(installmentsDebt.amount);
    const totalInst = Number(installmentsDebt.installmentsTotal);
    const realPaid = Number(installmentsDebt.installmentsPaid);
    const effPaid = getEffectivePaidInstallments(
      realPaid,
      totalInst,
      month,
      year
    );
    const totalVal = amount * totalInst;
    const paidVal = amount * effPaid;
    const remVal = totalVal - paidVal;

    const getStatus = (index: number) => {
      if (effPaid >= totalInst) return 'paid';
      if (effPaid === 0) return 'future';
      if (index < effPaid - 1) return 'paid';
      if (index === effPaid - 1) return 'current';
      return 'future';
    };

    return (
      <Modal
        visible={!!installmentsDebt}
        transparent
        animationType="slide"
        onRequestClose={() => setInstallmentsDebt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.fullModalCard,
              {
                backgroundColor: colors.background.paper,
                borderColor: colors.border,
                maxHeight: '85%',
                paddingBottom: 24 + safeBottom,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: colors.text.primary,
                  }}
                >
                  {installmentsDebt.description}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                  {t('debts_page.installments_modal.title')} —{' '}
                  {fCurrency(totalVal)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setInstallmentsDebt(null)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.installmentSummaryRow}>
              <View
                style={[
                  styles.instMiniCard,
                  { backgroundColor: colors.background.neutral },
                ]}
              >
                <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                  {t('debts_page.installments_modal.total')}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.text.primary,
                  }}
                >
                  {fCurrency(totalVal)}
                </Text>
              </View>
              <View
                style={[
                  styles.instMiniCard,
                  { backgroundColor: hexWithAlpha(colors.success.main, 0.14) },
                ]}
              >
                <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                  {t('debts_page.installments_modal.paid')}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.success.main,
                  }}
                >
                  {fCurrency(paidVal)}
                </Text>
              </View>
              <View
                style={[
                  styles.instMiniCard,
                  { backgroundColor: hexWithAlpha(colors.error.main, 0.14) },
                ]}
              >
                <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                  {t('debts_page.installments_modal.remaining')}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.error.main,
                  }}
                >
                  {fCurrency(remVal)}
                </Text>
              </View>
            </View>

            <ScrollView style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              {Array.from({ length: totalInst }, (_, idx) => {
                const st = getStatus(idx);
                const chipColor =
                  st === 'paid'
                    ? colors.success.main
                    : st === 'current'
                    ? colors.warning.main
                    : colors.text.disabled;
                const label =
                  st === 'paid'
                    ? t('debts_page.installments_modal.status_paid')
                    : st === 'current'
                    ? t('debts_page.installments_modal.status_current')
                    : t('debts_page.installments_modal.status_future');

                return (
                  <View
                    key={idx}
                    style={[
                      styles.instRow,
                      { borderBottomColor: colors.divider },
                    ]}
                  >
                    <Text
                      style={{
                        width: 44,
                        fontWeight: '700',
                        color: colors.text.primary,
                      }}
                    >
                      #{idx + 1}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: colors.text.secondary,
                      }}
                    >
                      {getInstallmentDate(
                        idx,
                        realPaid,
                        Number(installmentsDebt.paymentDay)
                      )}
                    </Text>
                    <Text
                      style={{
                        fontWeight: '700',
                        color: colors.text.primary,
                        marginRight: 10,
                      }}
                    >
                      {fCurrency(amount)}
                    </Text>
                    <View
                      style={[
                        styles.badgeChip,
                        { borderColor: chipColor },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: chipColor,
                        }}
                      >
                        {label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Debt Evolution Modal
  const renderDebtEvolutionModal = () => {
    if (!evolutionDebt) return null;
    const amount = Number(evolutionDebt.amount);
    const totalInst = Number(evolutionDebt.installmentsTotal);
    const realPaid = Number(evolutionDebt.installmentsPaid);
    const effPaid = getEffectivePaidInstallments(
      realPaid,
      totalInst,
      month,
      year
    );
    const totalVal = amount * totalInst;

    const now = new Date();
    const firstDate = new Date(
      now.getFullYear(),
      now.getMonth() - realPaid,
      1
    );

    const WINDOW = 12;
    const rawStart = Math.max(0, effPaid - 2);
    const windowEnd = Math.min(totalInst, rawStart + WINDOW);
    const windowStart = Math.max(0, windowEnd - WINDOW);

    const indices = Array.from(
      { length: windowEnd - windowStart + 1 },
      (_, i) => windowStart + i
    );
    const categories = indices.map((i) => {
      const d = new Date(
        firstDate.getFullYear(),
        firstDate.getMonth() + i,
        1
      );
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}/${yy}`;
    });
    const balanceData = indices.map((i) =>
      Math.max(totalVal - amount * i, 0)
    );
    const currentAnnotation = categories[indices.indexOf(effPaid)];

    return (
      <Modal
        visible={!!evolutionDebt}
        transparent
        animationType="slide"
        onRequestClose={() => setEvolutionDebt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.fullModalCard,
              {
                backgroundColor: colors.background.paper,
                borderColor: colors.border,
                paddingBottom: 24 + safeBottom,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: colors.text.primary,
                  }}
                >
                  {evolutionDebt.description}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                  {t('debts_page.evolution_modal.title')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEvolutionDebt(null)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <EvolutionLineChart
                categories={categories}
                primaryData={balanceData}
                primaryColor={colors.success.main}
                currentCategory={currentAnnotation}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 3 Summary Cards */}
        <View
          style={[
            styles.summaryBox,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          <Text style={{ fontSize: 12, color: colors.text.secondary }}>
            {t('debts_page.summary.total')}
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: colors.text.primary,
              marginTop: 2,
            }}
          >
            {fCurrency(totalDebt)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryHalfBox,
              {
                backgroundColor: hexWithAlpha(colors.success.main, 0.12),
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>
              {t('debts_page.summary.paid')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: colors.success.main,
                marginTop: 2,
              }}
            >
              {fCurrency(totalPaid)}
            </Text>
          </View>

          <View
            style={[
              styles.summaryHalfBox,
              {
                backgroundColor: hexWithAlpha(colors.error.main, 0.12),
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>
              {t('debts_page.summary.remaining')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: colors.error.main,
                marginTop: 2,
              }}
            >
              {fCurrency(totalRemaining)}
            </Text>
          </View>
        </View>

        {/* Debts List */}
        <View
          style={[
            styles.listCard,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          {activeDebts.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {t('debts_page.table.empty')}
            </Text>
          ) : (
            activeDebts.map((debt, idx) => {
              const realPaid = Number(debt.installmentsPaid);
              const total = Number(debt.installmentsTotal);
              const paid = getEffectivePaidInstallments(
                realPaid,
                total,
                month,
                year
              );

              return (
                <ItemRow
                  key={debt.id}
                  hideDivider={idx === activeDebts.length - 1}
                  avatarBg={colors.error.lighter}
                  avatarIcon="account-balance"
                  avatarIconColor={colors.error.main}
                  title={debt.description}
                  subtitle={
                    <>
                      <View
                        style={[
                          styles.badgeChip,
                          {
                            borderColor:
                              paid >= total
                                ? colors.success.main
                                : colors.warning.main,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color:
                              paid >= total
                                ? colors.success.main
                                : colors.warning.main,
                          }}
                        >
                          {paid}/{debt.installmentsTotal}
                        </Text>
                      </View>
                      <Text
                        style={{ fontSize: 12, color: colors.text.secondary }}
                      >
                        {t('settings.debt.table.headers.payment_day')}:{' '}
                        {debt.paymentDay}
                      </Text>
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
                      {fCurrency(debt.amount)}
                    </Text>
                  }
                  menuActions={[
                    {
                      label: t('common.edit'),
                      iconName: 'edit',
                      onPress: () => {
                        setEditingDebt(debt);
                        setFormOpen(true);
                      },
                    },
                    {
                      label: t('debts_page.actions.view_installments'),
                      iconName: 'list-alt',
                      onPress: () => setInstallmentsDebt(debt),
                    },
                    {
                      label: t('debts_page.actions.view_evolution'),
                      iconName: 'show-chart',
                      onPress: () => setEvolutionDebt(debt),
                    },
                    {
                      label: t('common.delete'),
                      iconName: 'delete',
                      color: 'error',
                      onPress: () => deleteMutation.mutate(debt.id),
                    },
                  ]}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary.main }]}
        onPress={() => {
          setEditingDebt(null);
          setFormOpen(true);
        }}
      >
        <MaterialIcons name="add" size={26} color="#FFF" />
      </TouchableOpacity>

      <DebtFormModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        data={editingDebt}
        envelopes={envelopes}
      />

      {renderInstallmentsModal()}
      {renderDebtEvolutionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  summaryBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryHalfBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  listCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 30,
    fontSize: 14,
  },
  badgeChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  fullModalCard: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(145,158,171,0.16)',
  },
  installmentSummaryRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  instMiniCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  instRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
});
