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
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { useSelectedMonthYearStore } from 'src/store/useSelectedMonthYearStore';
import {
  useDeleteGoals,
  useEffectiveGoalsCumulative,
  useHasGoals,
  useListGoals,
} from 'src/features/goals/api/useGoalsApi';
import { GoalFormModal } from 'src/features/goals/components/organisms/GoalFormModal';
import { EvolutionLineChart, FloatingAddButton, ItemRow } from 'src/shared/ui';
import { Goals } from 'src/types';
import {
  fCurrency,
  formatGoalDeadline,
  getGoalDeadlineInMonths,
  hexWithAlpha,
} from 'src/utils/format';

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
    <View
      style={[styles.container, { backgroundColor: colors.background.default }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.summaryBox,
            {
              backgroundColor: colors.background.paper,
              borderColor: colors.border,
            },
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

        <View
          style={[
            styles.listCard,
            {
              backgroundColor: colors.background.paper,
              borderColor: colors.border,
            },
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

      <FloatingAddButton
        onPress={() => {
          setEditingGoal(null);
          setFormOpen(true);
        }}
      />

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
});
