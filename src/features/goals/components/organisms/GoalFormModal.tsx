import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { BaseFormModal, CurrencyInput, FormInput } from 'src/shared/ui';
import {
  useCreateGoals,
  useDeleteGoals,
  useUpdateGoals,
} from 'src/features/goals/api/useGoalsApi';
import { useIncomeStore } from 'src/store/useIncomeStore';
import { Envelopes, Goals } from 'src/types';
import { fCurrency } from 'src/utils/format';

export interface GoalFormModalProps {
  visible: boolean;
  onClose: () => void;
  data?: Goals | null;
  envelope?: Envelopes;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  visible,
  onClose,
  data,
  envelope,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const income = useIncomeStore((s) => s.income);
  const createMutation = useCreateGoals();
  const updateMutation = useUpdateGoals();
  const deleteMutation = useDeleteGoals();

  const [description, setDescription] = useState('');
  const [amountTotal, setAmountTotal] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [monthYear, setMonthYear] = useState(true);
  const [errDesc, setErrDesc] = useState<string | null>(null);
  const [errTotal, setErrTotal] = useState<string | null>(null);
  const [errCurrent, setErrCurrent] = useState<string | null>(null);
  const [errDeadline, setErrDeadline] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDescription(data?.description ?? '');
      setAmountTotal(data?.amountTotal ? String(data.amountTotal) : '');
      setAmount(data?.amount ? String(data.amount) : '0.00');
      setDeadline(data?.deadline ? String(data.deadline) : '');
      setMonthYear(data?.monthYear ?? true);
      setErrDesc(null);
      setErrTotal(null);
      setErrCurrent(null);
      setErrDeadline(null);
    }
  }, [visible, data]);

  const months = monthYear ? Number(deadline || 0) : Number(deadline || 0) * 12;
  const realTotal = Math.max(0, Number(amountTotal || 0) - Number(amount || 0));
  const envPct = envelope?.percentage || 1;
  const envelopeBudget = (income * envPct) / 100;

  const savePerMonth = months > 0 ? realTotal / months : 0;
  const savePercentage =
    months > 0 && envelopeBudget > 0 ? (savePerMonth / envelopeBudget) * 100 : 0;
  const salaryIdeal = months > 0 && envPct > 0 ? (savePerMonth * 100) / envPct : 0;

  const handleSubmit = async () => {
    let valid = true;
    if (!description.trim()) {
      setErrDesc(t('settings.goals.validation.description_required'));
      valid = false;
    } else setErrDesc(null);

    if (!amountTotal.trim() || Number.isNaN(Number(amountTotal)) || Number(amountTotal) <= 0) {
      setErrTotal(t('settings.goals.validation.amount_required'));
      valid = false;
    } else setErrTotal(null);

    if (!amount.trim() || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      setErrCurrent(t('settings.goals.validation.amount_required'));
      valid = false;
    } else setErrCurrent(null);

    if (
      !deadline.trim() ||
      Number.isNaN(Number(deadline)) ||
      Number(deadline) <= 0
    ) {
      setErrDeadline(t('settings.goals.validation.deadline_required'));
      valid = false;
    } else setErrDeadline(null);

    if (!valid) return;

    const payload = {
      description,
      amount,
      amountTotal,
      percentage: savePercentage.toFixed(0),
      deadline: Number(deadline),
      monthYear,
    };

    try {
      if (data) {
        await updateMutation.mutateAsync({ id: data.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // handled by mutation onError toast
    }
  };

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={t('settings.goals.title')}
      onSubmit={handleSubmit}
      submitLabel={data ? t('common.save') : t('common.add')}
      loading={createMutation.isPending || updateMutation.isPending}
      onDelete={
        data
          ? async () => {
              try {
                await deleteMutation.mutateAsync(data.id);
                onClose();
              } catch {
                // handled by mutation onError toast
              }
            }
          : undefined
      }
      deleteLoading={deleteMutation.isPending}
    >
      <FormInput
        testID="goal-description-input"
        label={t('settings.goals.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        testID="goal-amount-total-input"
        label={t('settings.goals.amount_total')}
        value={amountTotal}
        onChange={setAmountTotal}
        error={!!errTotal}
        helperText={errTotal}
      />
      <CurrencyInput
        testID="goal-amount-current-input"
        label={t('settings.goals.amount_current')}
        value={amount}
        onChange={setAmount}
        error={!!errCurrent}
        helperText={errCurrent}
      />
      <FormInput
        testID="goal-deadline-input"
        label={t('settings.goals.deadline')}
        value={deadline}
        onChangeText={setDeadline}
        keyboardType="numeric"
        error={errDeadline}
        rightElement={
          <TouchableOpacity
            testID="goal-unit-toggle"
            onPress={() => setMonthYear(!monthYear)}
            style={[
              styles.unitToggle,
              { backgroundColor: colors.primary.main },
            ]}
          >
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
              {monthYear
                ? t('settings.goals.time.months')
                : t('settings.goals.time.years')}
            </Text>
          </TouchableOpacity>
        }
      />

      <View
        style={[
          styles.recContainer,
          {
            backgroundColor: colors.background.neutral,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.recHeader, { color: colors.text.primary }]}>
          {t('settings.goals.recommendation.title')}
        </Text>
        {salaryIdeal > income && income > 0 && (
          <Text
            style={{ color: colors.error.main, fontSize: 12, marginBottom: 8 }}
          >
            {t('settings.goals.recommendation.unfeasible', {
              income: fCurrency(income),
            })}
          </Text>
        )}
        <Text
          style={{
            color: colors.primary.main,
            fontWeight: '700',
            fontSize: 13,
          }}
        >
          •{' '}
          {t('settings.goals.recommendation.monthly_save', {
            amount: savePerMonth.toFixed(2),
          })}
        </Text>
        <Text
          style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4 }}
        >
          •{' '}
          {t('settings.goals.recommendation.envelope_percentage', {
            percentage: savePercentage.toFixed(2),
          })}
        </Text>
        <Text
          style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4 }}
        >
          •{' '}
          {t('settings.goals.recommendation.ideal_income', {
            amount: salaryIdeal.toFixed(2),
          })}
        </Text>
      </View>
    </BaseFormModal>
  );
};

const styles = StyleSheet.create({
  unitToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  recContainer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  recHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
});
