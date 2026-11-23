import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { ItemRow } from 'src/shared/ui';
import {
  CreditCardFormModal,
  DebtFormModal,
  EnvelopeLimitFormModal,
  FixedExpenseFormModal,
  GoalFormModal,
  SalaryFormModal,
} from 'src/components/FormModals';
import {
  CreditCards,
  Debts,
  Envelopes,
  FixedExpenses,
  Goals,
  Incomes,
} from 'src/types';
import { fCurrency, formatGoalDeadline, hexWithAlpha } from 'src/utils/format';
import { useIncomeStore } from 'src/store/useIncomeStore';

function useOpenAddOnTrigger(
  addTrigger: number | undefined,
  onTrigger: () => void
) {
  const prevTrigger = useRef(addTrigger);
  const callbackRef = useRef(onTrigger);
  callbackRef.current = onTrigger;

  useEffect(() => {
    if (addTrigger !== prevTrigger.current) {
      prevTrigger.current = addTrigger;
      callbackRef.current();
    }
  }, [addTrigger]);
}

// ─── 1. Salary / Income Section ───────────────────────────────────────────────

export const IncomesSection: React.FC<{
  items: Incomes[];
  addTrigger?: number;
}> = ({ items, addTrigger }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Incomes | null>(null);

  useOpenAddOnTrigger(addTrigger, () => {
    setEditing(null);
    setModalOpen(true);
  });

  return (
    <View style={styles.section}>
      <View style={styles.topBar}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('settings.tabs.income')}
        </Text>
      </View>

      <View
        style={[
          styles.listCard,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        {items.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {t('settings.income.table.no_data')}
          </Text>
        ) : (
          items.map((item, idx) => (
            <ItemRow
              key={item.id}
              hideDivider={idx === items.length - 1}
              avatarBg={colors.success.lighter}
              avatarIcon="arrow-downward"
              avatarIconColor={colors.success.main}
              title={item.description}
              subtitle={
                <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                  {t('settings.income.table.headers.payment_day')}: {item.paymentDay}
                </Text>
              }
              amount={
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: colors.success.main,
                  }}
                >
                  {fCurrency(item.amount)}
                </Text>
              }
              onPress={() => {
                setEditing(item);
                setModalOpen(true);
              }}
            />
          ))
        )}
      </View>

      <SalaryFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        data={editing}
      />
    </View>
  );
};

// ─── 2. Envelopes Limits Section ──────────────────────────────────────────────

export const EnvelopesLimitsSection: React.FC<{ envelopes: Envelopes[] }> = ({
  envelopes,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const income = useIncomeStore((s) => s.income);

  const [selectedEnv, setSelectedEnv] = useState<Envelopes | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalAllocation = Number(
    envelopes.reduce((acc, item) => acc + item.percentage, 0).toFixed(2)
  );

  const getBadgeConfig = () => {
    if (totalAllocation === 100) {
      return {
        text: t('settings.envelope.allocation_full'),
        bg: colors.success.main,
      };
    }
    if (totalAllocation < 100) {
      return {
        text: t('settings.envelope.allocation_remaining', {
          count: Number((100 - totalAllocation).toFixed(2)),
        }),
        bg: colors.warning.main,
      };
    }
    return {
      text: t('settings.envelope.allocation_exceeded', {
        count: Number((totalAllocation - 100).toFixed(2)),
      }),
      bg: colors.error.main,
    };
  };

  const badge = getBadgeConfig();

  return (
    <View style={styles.section}>
      <View style={styles.topBar}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('settings.tabs.envelopes')}
        </Text>
        <View style={[styles.allocationBadge, { backgroundColor: badge.bg }]}>
          <Text style={styles.allocationBadgeText}>{badge.text}</Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {envelopes.map((env) => {
          const envVal = (env.percentage / 100) * income;
          const belowMin = env.minAmount && income > 0 && envVal < env.minAmount;

          return (
            <TouchableOpacity
              key={env.id}
              onPress={() => {
                setSelectedEnv(env);
                setModalOpen(true);
              }}
              style={[
                styles.envelopeLimitCard,
                {
                  backgroundColor: colors.background.paper,
                  borderColor: colors.border,
                  borderTopColor: env.color || colors.primary.main,
                },
              ]}
            >
              <View style={styles.envCardHeader}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.text.primary,
                  }}
                >
                  {t(env.name)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {belowMin ? (
                    <MaterialIcons
                      name="warning-amber"
                      size={18}
                      color={colors.warning.main}
                    />
                  ) : null}
                  {income > 0 && (
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.text.secondary,
                      }}
                    >
                      {fCurrency(envVal)}
                    </Text>
                  )}
                </View>
              </View>

              <View
                style={[
                  styles.envPctTrack,
                  { backgroundColor: hexWithAlpha(env.color || '#1877F2', 0.16) },
                ]}
              >
                <View
                  style={[
                    styles.envPctFill,
                    {
                      width: `${Math.min(100, Math.max(0, env.percentage))}%`,
                      backgroundColor: hexWithAlpha(env.color || '#1877F2', 0.78),
                    },
                  ]}
                />
                <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                  <View
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: colors.text.primary,
                      }}
                    >
                      {Number(env.percentage.toFixed(2))}%
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <EnvelopeLimitFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selectedEnv}
        allEnvelopes={envelopes}
      />
    </View>
  );
};

// ─── 3. Goals Section (Settings / Onboarding) ─────────────────────────────────

export const GoalsSettingsSection: React.FC<{
  items: Goals[];
  goalsEnvelope?: Envelopes;
  addTrigger?: number;
}> = ({ items, goalsEnvelope, addTrigger }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goals | null>(null);

  useOpenAddOnTrigger(addTrigger, () => {
    setEditing(null);
    setModalOpen(true);
  });

  return (
    <View style={styles.section}>
      <View style={styles.topBar}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('settings.tabs.goals')}
        </Text>
      </View>

      <View
        style={[
          styles.listCard,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        {items.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {t('settings.goals.table.no_data')}
          </Text>
        ) : (
          items.map((item, idx) => (
            <ItemRow
              key={item.id}
              hideDivider={idx === items.length - 1}
              avatarBg={colors.primary.lighter}
              avatarIcon="savings"
              avatarIconColor={colors.primary.main}
              title={item.description}
              subtitle={
                <>
                  <View
                    style={[
                      styles.smallBadge,
                      { borderColor: colors.info.main },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.info.main,
                      }}
                    >
                      {item.percentage}%
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                    {formatGoalDeadline(t, item.deadline, item.monthYear)}
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
                  {fCurrency(item.amountTotal)}
                </Text>
              }
              onPress={() => {
                setEditing(item);
                setModalOpen(true);
              }}
            />
          ))
        )}
      </View>

      <GoalFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        data={editing}
        envelope={goalsEnvelope}
      />
    </View>
  );
};

// ─── 4. Fixed Expenses Section ────────────────────────────────────────────────

export const FixedExpensesSection: React.FC<{
  items: FixedExpenses[];
  envelopes: Envelopes[];
  addTrigger?: number;
}> = ({ items, envelopes, addTrigger }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpenses | null>(null);

  useOpenAddOnTrigger(addTrigger, () => {
    setEditing(null);
    setModalOpen(true);
  });

  return (
    <View style={styles.section}>
      <View style={styles.topBar}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('settings.tabs.fixed_expenses')}
        </Text>
      </View>

      <View
        style={[
          styles.listCard,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        {items.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {t('settings.fixed_expense.table.no_data')}
          </Text>
        ) : (
          items.map((item, idx) => {
            const envName =
              envelopes.find((e) => e.id === item.envelopeId)?.name || '';
            return (
              <ItemRow
                key={item.id}
                hideDivider={idx === items.length - 1}
                avatarBg={colors.error.lighter}
                avatarIcon="arrow-upward"
                avatarIconColor={colors.error.main}
                title={item.description}
                subtitle={
                  <>
                    <View
                      style={[
                        styles.smallBadge,
                        { borderColor: colors.primary.main },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: colors.primary.main,
                        }}
                      >
                        {t(envName)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                      {item.creditCardName ??
                        t(
                          item.paymentMethod ??
                            'envelope.transaction.payment_method.Cash'
                        )}{' '}
                      • {t('settings.fixed_expense.table.headers.payment_day')}:{' '}
                      {item.paymentDay}
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
                    - {fCurrency(item.amount)}
                  </Text>
                }
                onPress={() => {
                  setEditing(item);
                  setModalOpen(true);
                }}
              />
            );
          })
        )}
      </View>

      <FixedExpenseFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        data={editing}
        envelopes={envelopes}
      />
    </View>
  );
};

// ─── 5. Debts Section (Settings / Onboarding) ─────────────────────────────────

export const DebtsSettingsSection: React.FC<{
  items: Debts[];
  envelopes: Envelopes[];
  addTrigger?: number;
}> = ({ items, envelopes, addTrigger }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debts | null>(null);

  useOpenAddOnTrigger(addTrigger, () => {
    setEditing(null);
    setModalOpen(true);
  });

  return (
    <View style={styles.section}>
      <View style={styles.topBar}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('settings.tabs.debts')}
        </Text>
      </View>

      <View
        style={[
          styles.listCard,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        {items.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {t('settings.debt.table.no_data')}
          </Text>
        ) : (
          items.map((item, idx) => (
            <ItemRow
              key={item.id}
              hideDivider={idx === items.length - 1}
              avatarBg={colors.error.lighter}
              avatarIcon="account-balance"
              avatarIconColor={colors.error.main}
              title={item.description}
              subtitle={
                <>
                  <View
                    style={[
                      styles.smallBadge,
                      { borderColor: colors.warning.main },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.warning.main,
                      }}
                    >
                      {item.installmentsPaid}/{item.installmentsTotal}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                    {t('settings.debt.table.headers.payment_day')}: {item.paymentDay}
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
                  {fCurrency(item.amount)}
                </Text>
              }
              onPress={() => {
                setEditing(item);
                setModalOpen(true);
              }}
            />
          ))
        )}
      </View>

      <DebtFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        data={editing}
        envelopes={envelopes}
      />
    </View>
  );
};

// ─── 6. Credit Cards Section ──────────────────────────────────────────────────

export const CreditCardsSection: React.FC<{
  items: CreditCards[];
  addTrigger?: number;
}> = ({ items, addTrigger }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCards | null>(null);

  useOpenAddOnTrigger(addTrigger, () => {
    setEditing(null);
    setModalOpen(true);
  });

  return (
    <View style={styles.section}>
      <View style={styles.topBar}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('settings.tabs.credit_cards')}
        </Text>
      </View>

      <View
        style={[
          styles.listCard,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        {items.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {t('settings.credit_card.table.no_data')}
          </Text>
        ) : (
          items.map((item, idx) => (
            <ItemRow
              key={item.id}
              hideDivider={idx === items.length - 1}
              avatarBg={colors.primary.lighter}
              avatarIcon="credit-card"
              avatarIconColor={colors.primary.main}
              title={item.name}
              amount={
                <View
                  style={[
                    styles.smallBadge,
                    { borderColor: colors.primary.main },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.primary.main,
                    }}
                  >
                    {item.flag}
                  </Text>
                </View>
              }
              onPress={() => {
                setEditing(item);
                setModalOpen(true);
              }}
            />
          ))
        )}
      </View>

      <CreditCardFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        data={editing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  listCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 28,
    fontSize: 14,
  },
  smallBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  allocationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  allocationBadgeText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 11,
  },
  envelopeLimitCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 4,
    padding: 14,
  },
  envCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  envPctTrack: {
    height: 20,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  envPctFill: {
    height: '100%',
    borderRadius: 6,
  },
});
