import React, { useEffect, useMemo, useState } from 'react';
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
  envelopeBalance?: number;
  data?: Transactions | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  visible,
  onClose,
  envelopeId,
  envelopeBalance,
  data,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const createMutation = useCreateTransactions();
  const updateMutation = useUpdateTransactions();
  const deleteMutation = useDeleteTransactions();
  const { data: creditCardsData } = useListCreditCards();
  const creditCards = useMemo(() => creditCardsData?.data ?? [], [creditCardsData?.data]);

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
        const match = String(data.date).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (match) {
          setSelectedDate(
            new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
          );
        } else {
          const d = dayjs(data.date);
          setSelectedDate(
            d.isValid() ? new Date(d.year(), d.month(), d.date()) : new Date()
          );
        }
      } else {
        setSelectedDate(new Date());
      }
      setStatus(data?.status ?? 'transaction.status.pending');
      setPaymentMethod(
        data?.paymentMethod ?? 'envelope.transaction.payment_method.DebitCard'
      );
      setCreditCardId(data?.creditCardId ?? '');
      setErrDesc(null);
      setErrAmount(null);
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

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrDesc(t('envelope.validation.description_required'));
      return;
    }
    setErrDesc(null);

    if (!amount.trim() || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrAmount(t('envelope.validation.amount_required'));
      return;
    }
    setErrAmount(null);

    const isCredit =
      paymentMethod === 'envelope.transaction.payment_method.CreditCard';
    const isoDate = dayjs(selectedDate).format('YYYY-MM-DD');

    try {
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
          type: data.type ?? 'Debit',
          isTranslatable: data.isTranslatable,
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
    } catch {
      // handled by mutation onError toast
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    try {
      await deleteMutation.mutateAsync(data.id);
      onClose();
    } catch {
      // handled by mutation onError toast
    }
  };

  const isCompleted = status === 'transaction.status.completed';
  const isReallocation =
    data?.paymentMethod === 'envelope.transaction.payment_method.Reallocation';

  const numericAmount = Number(amount);
  const isDebit = !data || data.type === 'Debit';
  const wasCompleted = data?.status === 'transaction.status.completed';
  const neededAmount = wasCompleted
    ? numericAmount - Number(data.amount)
    : numericAmount;
  const exceedsBalance =
    isDebit &&
    envelopeBalance !== undefined &&
    !Number.isNaN(numericAmount) &&
    neededAmount > 0 &&
    neededAmount > envelopeBalance;

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
      {exceedsBalance && (
        <View
          testID="transaction-exceeds-balance-warning"
          style={[
            styles.warningBanner,
            {
              backgroundColor: colors.warning.lighter,
              borderColor: colors.warning.main,
            },
          ]}
        >
          <MaterialIcons
            name="warning-amber"
            size={18}
            color={colors.warning.dark}
            style={{ marginTop: 1 }}
          />
          <Text
            style={[styles.warningBannerText, { color: colors.warning.dark }]}
          >
            {t('envelope.validation.exceeds_balance_warning')}
          </Text>
        </View>
      )}
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
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
