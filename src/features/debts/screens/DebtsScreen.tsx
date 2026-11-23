import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
  useDeleteDebts,
  useListDebts,
} from 'src/features/debts/api/useDebtsApi';
import { useListEnvelopesWithAmount } from 'src/features/envelopes/api/useEnvelopesApi';
import { DebtFormModal } from 'src/features/debts/components/organisms/DebtFormModal';
import { EvolutionLineChart, FloatingAddButton, ItemRow } from 'src/shared/ui';
import { Debts } from 'src/types';
import {
  fCurrency,
  getEffectivePaidInstallments,
  getInstallmentDate,
  hexWithAlpha,
} from 'src/utils/format';

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

    const now = new Date();
    const offsetFromNow =
      (year - now.getFullYear()) * 12 + (month - 1 - now.getMonth());
    const selectedIndex = realPaid + offsetFromNow;

    const getStatus = (index: number) => {
      if (effPaid >= totalInst) return 'paid';
      if (selectedIndex < 0) return 'future';
      if (index < effPaid) return 'paid';
      if (index === effPaid) return 'current';
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

            <FlatList
              data={Array.from({ length: Math.max(0, totalInst) }, (_, i) => i)}
              keyExtractor={(idx) => String(idx)}
              style={{ paddingHorizontal: 16, marginBottom: 16 }}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={7}
              renderItem={({ item: idx }) => {
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
                      style={[styles.badgeChip, { borderColor: chipColor }]}
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
              }}
            />
          </View>
        </View>
      </Modal>
    );
  };

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
      const d = new Date(firstDate.getFullYear(), firstDate.getMonth() + i, 1);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${mm}/${yy}`;
    });
    const balanceData = indices.map((i) => Math.max(totalVal - amount * i, 0));
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

        <View
          style={[
            styles.listCard,
            {
              backgroundColor: colors.background.paper,
              borderColor: colors.border,
            },
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

      <FloatingAddButton
        onPress={() => {
          setEditingDebt(null);
          setFormOpen(true);
        }}
      />

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
