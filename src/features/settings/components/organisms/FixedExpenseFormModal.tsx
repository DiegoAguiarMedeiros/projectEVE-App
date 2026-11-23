import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { BaseFormModal, CurrencyInput, FormInput } from 'src/shared/ui';
import {
  useCreateFixedExpenses,
  useDeleteFixedExpenses,
  useListCreditCards,
  useUpdateFixedExpenses,
} from 'src/features/settings/api/useSettingsApi';
import {
  allPaymentMethod,
  Envelopes,
  FixedExpenses,
  PaymentMethod,
} from 'src/types';

export interface FixedExpenseFormModalProps {
  visible: boolean;
  onClose: () => void;
  data?: FixedExpenses | null;
  envelopes: Envelopes[];
}

export const FixedExpenseFormModal: React.FC<FixedExpenseFormModalProps> = ({
  visible,
  onClose,
  data,
  envelopes,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const createMutation = useCreateFixedExpenses();
  const updateMutation = useUpdateFixedExpenses();
  const deleteMutation = useDeleteFixedExpenses();
  const { data: creditCardsData } = useListCreditCards();
  const creditCards = useMemo(() => creditCardsData?.data ?? [], [creditCardsData?.data]);

  const selectableEnvelopes = useMemo(
    () => envelopes.filter((e) => e.name !== 'debts' && e.name !== 'goals'),
    [envelopes]
  );

  const [envelopeId, setEnvelopeId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    'envelope.transaction.payment_method.Cash'
  );
  const [creditCardId, setCreditCardId] = useState('');
  const [errDesc, setErrDesc] = useState<string | null>(null);
  const [errAmount, setErrAmount] = useState<string | null>(null);
  const [errDay, setErrDay] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEnvelopeId(data?.envelopeId ?? '');
      setDescription(data?.description ?? '');
      setAmount(data?.amount ? String(data.amount) : '');
      setPaymentDay(data?.paymentDay ? String(data.paymentDay) : '');
      setPaymentMethod(
        data?.paymentMethod ?? 'envelope.transaction.payment_method.Cash'
      );
      setCreditCardId(data?.creditCardId ?? '');
      setErrDesc(null);
      setErrAmount(null);
      setErrDay(null);
    }
  }, [visible, data]);

  useEffect(() => {
    if (visible && !creditCardId && creditCards.length > 0) {
      setCreditCardId(creditCards[0].id);
    }
  }, [visible, creditCardId, creditCards]);

  const availableMethods = allPaymentMethod.filter((m) => {
    if (m === 'envelope.transaction.payment_method.Reallocation') return false;
    if (
      m === 'envelope.transaction.payment_method.CreditCard' &&
      creditCards.length === 0
    ) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (visible && !envelopeId && selectableEnvelopes.length > 0) {
      setEnvelopeId(selectableEnvelopes[0].id);
    }
  }, [visible, envelopeId, selectableEnvelopes]);

  const handleSubmit = async () => {
    if (!envelopeId) {
      return;
    }
    if (!description.trim()) {
      setErrDesc(t('settings.fixed_expense.validation.description_required'));
      return;
    }
    setErrDesc(null);

    if (!amount.trim() || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrAmount(t('settings.fixed_expense.validation.amount_required'));
      return;
    }
    setErrAmount(null);

    const d = Number(paymentDay);
    if (!paymentDay.trim() || Number.isNaN(d) || d < 1 || d > 31) {
      setErrDay(t('settings.fixed_expense.validation.payment_day_range'));
      return;
    }
    setErrDay(null);

    const isCredit =
      paymentMethod === 'envelope.transaction.payment_method.CreditCard';

    try {
      if (data) {
        await updateMutation.mutateAsync({
          id: data.id,
          envelopeId,
          description,
          amount,
          paymentDay,
          paymentMethod,
          creditCardId: isCredit ? creditCardId || undefined : undefined,
        });
      } else {
        await createMutation.mutateAsync({
          envelopeId,
          description,
          amount,
          paymentDay,
          paymentMethod,
          creditCardId: isCredit ? creditCardId || undefined : undefined,
        });
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
      title={t('settings.fixed_expense.title')}
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
      <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
        {t('settings.fixed_expense.envelope')}
      </Text>
      <View style={[styles.chipsWrap, { marginBottom: 14 }]}>
        {selectableEnvelopes.map((env) => {
          const active = env.id === envelopeId;
          return (
            <TouchableOpacity
              key={env.id}
              onPress={() => setEnvelopeId(env.id)}
              style={[
                styles.optionChip,
                {
                  backgroundColor: active
                    ? colors.primary.main
                    : colors.background.neutral,
                  borderColor: active ? colors.primary.main : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? '#FFF' : colors.text.primary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {t(env.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FormInput
        testID="fixed-expense-description-input"
        label={t('settings.fixed_expense.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        testID="fixed-expense-amount-input"
        label={t('settings.fixed_expense.amount')}
        value={amount}
        onChange={setAmount}
        error={!!errAmount}
        helperText={errAmount}
      />
      <FormInput
        testID="fixed-expense-day-input"
        label={t('settings.fixed_expense.payment_day')}
        value={paymentDay}
        onChangeText={setPaymentDay}
        keyboardType="numeric"
        placeholder="1 - 31"
        error={errDay}
      />

      <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
        {t('envelope.transaction.payment_method_label')}
      </Text>
      <View style={[styles.chipsWrap, { marginBottom: 14 }]}>
        {availableMethods.map((m) => {
          const active = paymentMethod === m;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => setPaymentMethod(m)}
              style={[
                styles.optionChip,
                {
                  backgroundColor: active
                    ? colors.primary.main
                    : colors.background.neutral,
                  borderColor: active ? colors.primary.main : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? '#FFF' : colors.text.primary,
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {t(m)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {paymentMethod === 'envelope.transaction.payment_method.CreditCard' &&
        creditCards.length > 0 && (
          <>
            <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
              {t('envelope.transaction.payment_method.CreditCard')}
            </Text>
            <View style={[styles.chipsWrap, { marginBottom: 14 }]}>
              {creditCards.map((card) => {
                const active = creditCardId === card.id;
                return (
                  <TouchableOpacity
                    key={card.id}
                    onPress={() => setCreditCardId(card.id)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: active
                          ? colors.primary.main
                          : colors.background.neutral,
                        borderColor: active
                          ? colors.primary.main
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? '#FFF' : colors.text.primary,
                        fontWeight: '600',
                        fontSize: 12,
                      }}
                    >
                      {card.name} ({card.flag})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
    </BaseFormModal>
  );
};

const styles = StyleSheet.create({
  fieldTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
});
