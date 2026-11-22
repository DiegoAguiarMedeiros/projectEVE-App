import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAppTheme } from 'src/theme';
import {
  BaseFormModal,
  CurrencyInput,
  DatePickerField,
  FormInput,
} from 'src/shared/ui';
import {
  useCreateTransactions,
  useDeleteTransactions,
  useUpdateTransactions,
} from 'src/features/transactions/api/useTransactionsApi';
import { useListCreditCards } from 'src/features/settings/api/useSettingsApi';
import {
  allPaymentMethod,
  PaymentMethod,
  Transactions,
  TransactionsStatus,
} from 'src/types';

export interface TransactionFormModalProps {
  visible: boolean;
  onClose: () => void;
  envelopeId: string;
  data?: Transactions | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  visible,
  onClose,
  envelopeId,
  data,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const createMutation = useCreateTransactions();
  const updateMutation = useUpdateTransactions();
  const deleteMutation = useDeleteTransactions();
  const { data: creditCardsData } = useListCreditCards();
  const creditCards = creditCardsData?.data ?? [];

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [status, setStatus] = useState<TransactionsStatus>(
    'transaction.status.pending'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    'envelope.transaction.payment_method.DebitCard'
  );
  const [creditCardId, setCreditCardId] = useState('');
  const [errDesc, setErrDesc] = useState<string | null>(null);
  const [errAmount, setErrAmount] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDescription(data?.description ?? '');
      setAmount(data?.amount ? String(data.amount) : '');
      if (data?.date) {
        const d = dayjs(data.date);
        setSelectedDate(
          d.isValid() ? new Date(d.year(), d.month(), d.date()) : new Date()
        );
      } else {
        setSelectedDate(new Date());
      }
      setStatus(data?.status ?? 'transaction.status.pending');
      setPaymentMethod(
        data?.paymentMethod ?? 'envelope.transaction.payment_method.DebitCard'
      );
      setCreditCardId(data?.creditCardId ?? creditCards[0]?.id ?? '');
      setErrDesc(null);
      setErrAmount(null);
    }
  }, [visible, data, creditCards]);

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

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrDesc(t('envelope.validation.description_required'));
      return;
    }
    if (!amount.trim() || Number.isNaN(Number(amount))) {
      setErrAmount(t('envelope.validation.amount_required'));
      return;
    }

    const isCredit =
      paymentMethod === 'envelope.transaction.payment_method.CreditCard';
    const isoDate = dayjs(selectedDate).format('YYYY-MM-DD');

    if (data) {
      await updateMutation.mutateAsync({
        id: data.id,
        description,
        amount,
        status,
        envelopeId,
        paymentMethod,
        creditCardId: isCredit ? creditCardId || undefined : undefined,
        date: isoDate,
        type: 'Debit',
      });
    } else {
      await createMutation.mutateAsync({
        description,
        amount,
        status: 'transaction.status.pending',
        envelopeId,
        paymentMethod,
        creditCardId: isCredit ? creditCardId || undefined : undefined,
        date: isoDate,
        type: 'Debit',
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!data) return;
    await deleteMutation.mutateAsync(data.id);
    onClose();
  };

  const isCompleted = status === 'transaction.status.completed';
  const isReallocation =
    data?.paymentMethod === 'envelope.transaction.payment_method.Reallocation';

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={t('envelope.transaction.tabs.transaction')}
      onSubmit={handleSubmit}
      submitLabel={data ? t('common.save') : t('common.add')}
      loading={createMutation.isPending || updateMutation.isPending}
      onDelete={data ? handleDelete : undefined}
      deleteLoading={deleteMutation.isPending}
    >
      <FormInput
        testID="transaction-description-input"
        label={t('envelope.transaction.description')}
        placeholder={t('envelope.transaction.placeholder.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        testID="transaction-amount-input"
        label={t('envelope.transaction.amount')}
        value={amount}
        onChange={setAmount}
        error={!!errAmount}
        helperText={errAmount}
      />
      <DatePickerField
        label={t('envelope.transaction.date')}
        value={selectedDate}
        onChange={setSelectedDate}
      />

      <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
        {t('envelope.transaction.payment_method_label')}
      </Text>
      <View style={styles.chipsWrap}>
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
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
              {t('envelope.transaction.payment_method.CreditCard')}
            </Text>
            <View style={styles.chipsWrap}>
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
          </View>
        )}

      {data && (
        <View
          style={[
            styles.statusToggleRow,
            {
              backgroundColor: colors.background.neutral,
              borderColor: isCompleted ? colors.success.main : colors.border,
            },
          ]}
        >
          <View style={styles.statusToggleInfo}>
            <MaterialIcons
              name={isCompleted ? 'check-circle' : 'schedule'}
              size={20}
              color={isCompleted ? colors.success.main : colors.warning.main}
            />
            <Text
              style={[styles.statusToggleLabel, { color: colors.text.primary }]}
            >
              {isCompleted
                ? t('transaction.status.completed')
                : t('transaction.status.pending')}
            </Text>
          </View>
          <Switch
            testID="transaction-status-switch"
            disabled={isReallocation}
            value={isCompleted}
            onValueChange={(val) =>
              setStatus(
                val
                  ? 'transaction.status.completed'
                  : 'transaction.status.pending'
              )
            }
            trackColor={{ false: colors.divider, true: colors.success.light }}
            thumbColor={isCompleted ? colors.success.main : '#FFF'}
          />
        </View>
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
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  statusToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
