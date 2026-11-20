import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { CurrencyInput } from './CurrencyInput';
import { AppButton, FormInput } from './FormElements';
import {
  useCreateCreditCards,
  useCreateDebts,
  useCreateFixedExpenses,
  useCreateGoals,
  useCreateIncomes,
  useCreateProcessedIncomes,
  useCreateTransactions,
  useDeleteCreditCards,
  useDeleteDebts,
  useDeleteFixedExpenses,
  useDeleteGoals,
  useDeleteIncomes,
  useDeleteProcessedIncomes,
  useDeleteTransactions,
  useListCreditCards,
  useUpdateCreditCards,
  useUpdateDebts,
  useUpdateEnvelopes,
  useUpdateFixedExpenses,
  useUpdateGoals,
  useUpdateIncomes,
  useUpdateProcessedIncomes,
  useUpdateTransactions,
} from 'src/hooks/useApi';
import {
  allFlags,
  allPaymentMethod,
  CreditCards,
  Debts,
  Envelopes,
  FixedExpenses,
  Flags,
  Goals,
  Incomes,
  PaymentMethod,
  ProcessedIncomes,
  Transactions,
  TransactionsStatus,
} from 'src/types';
import { useIncomeStore } from 'src/store/useIncomeStore';
import { usePreferencesStore } from 'src/store/usePreferencesStore';
import { fCurrency } from 'src/utils/format';
import dayjs from 'dayjs';

interface DatePickerFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
}) => {
  const { colors, isDark } = useAppTheme();
  const dateFormat = usePreferencesStore((s) => s.dateFormat);
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.dateFieldWrapper}>
      <Text style={[styles.dateFieldLabel, { color: colors.text.secondary }]}>
        {label}
      </Text>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setOpen((prev) => !prev)}
        style={[
          styles.dateFieldBox,
          {
            backgroundColor: colors.background.neutral,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.dateFieldText, { color: colors.text.primary }]}>
          {dayjs(value).format(dateFormat)}
        </Text>
        <MaterialIcons
          name="calendar-today"
          size={19}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {open && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={handleChange}
        />
      )}
    </View>
  );
};

// ─── Base Modal Shell ─────────────────────────────────────────────────────────

interface BaseFormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel: string;
  loading?: boolean;
  disabled?: boolean;
  onDelete?: () => void;
  deleteLoading?: boolean;
}

export const BaseFormModal: React.FC<BaseFormModalProps> = ({
  visible,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel,
  loading,
  disabled,
  onDelete,
  deleteLoading,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const safeBottom =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 48 : 16;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalBox,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <MaterialIcons name="close" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            {children}
            {onDelete && (
              <View style={{ marginTop: 14 }}>
                <AppButton
                  title={t('common.delete')}
                  variant="outlined"
                  color="error"
                  onPress={onDelete}
                  loading={deleteLoading}
                />
              </View>
            )}
          </ScrollView>

          <View
            style={[
              styles.modalFooter,
              {
                borderTopColor: colors.divider,
                paddingBottom: 16 + safeBottom,
              },
            ]}
          >
            <AppButton
              title={t('common.cancel')}
              variant="outlined"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <AppButton
              title={submitLabel}
              onPress={onSubmit}
              loading={loading}
              disabled={disabled}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── 1. Salary / Recurring Income Form Modal ──────────────────────────────────

export const SalaryFormModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data?: Incomes | null;
}> = ({ visible, onClose, data }) => {
  const { t } = useTranslation();
  const createMutation = useCreateIncomes();
  const updateMutation = useUpdateIncomes();
  const deleteMutation = useDeleteIncomes();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [errDesc, setErrDesc] = useState<string | null>(null);
  const [errAmount, setErrAmount] = useState<string | null>(null);
  const [errDay, setErrDay] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDescription(data?.description ?? '');
      setAmount(data?.amount ? String(data.amount) : '');
      setPaymentDay(data?.paymentDay ? String(data.paymentDay) : '');
      setErrDesc(null);
      setErrAmount(null);
      setErrDay(null);
    }
  }, [visible, data]);

  const handleSubmit = async () => {
    let valid = true;
    if (!description.trim()) {
      setErrDesc(t('settings.income.validation.description_required'));
      valid = false;
    } else setErrDesc(null);

    if (!amount.trim() || Number.isNaN(Number(amount))) {
      setErrAmount(t('settings.income.validation.amount_required'));
      valid = false;
    } else setErrAmount(null);

    const d = Number(paymentDay);
    if (!paymentDay.trim() || Number.isNaN(d) || d < 1 || d > 31) {
      setErrDay(t('settings.income.validation.payment_day_range'));
      valid = false;
    } else setErrDay(null);

    if (!valid) return;

    if (data) {
      await updateMutation.mutateAsync({
        id: data.id,
        description,
        amount,
        paymentDay,
      });
    } else {
      await createMutation.mutateAsync({
        description,
        amount,
        paymentDay,
      });
    }
    onClose();
  };

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={t('settings.income.title')}
      onSubmit={handleSubmit}
      submitLabel={data ? t('common.save') : t('common.add')}
      loading={createMutation.isPending || updateMutation.isPending}
      onDelete={
        data
          ? async () => {
              await deleteMutation.mutateAsync(data.id);
              onClose();
            }
          : undefined
      }
      deleteLoading={deleteMutation.isPending}
    >
      <FormInput
        label={t('settings.income.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        label={t('settings.income.amount')}
        value={amount}
        onChange={setAmount}
        error={!!errAmount}
        helperText={errAmount}
      />
      <FormInput
        label={t('settings.income.payment_day')}
        value={paymentDay}
        onChangeText={setPaymentDay}
        keyboardType="numeric"
        placeholder="1 - 31"
        error={errDay}
      />
    </BaseFormModal>
  );
};

// ─── 2. Processed Income Form Modal ───────────────────────────────────────────

export const ProcessedIncomeFormModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data?: ProcessedIncomes | null;
  envelopes: Envelopes[];
  fixedMonth?: number;
  fixedYear?: number;
}> = ({ visible, onClose, data, envelopes, fixedMonth, fixedYear }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const createMutation = useCreateProcessedIncomes();
  const updateMutation = useUpdateProcessedIncomes();
  const deleteMutation = useDeleteProcessedIncomes();

  const isDayOnly = fixedMonth !== undefined && fixedYear !== undefined;

  const [description, setDescription] = useState('');
  const [totalIncomeProcessed, setTotalIncomeProcessed] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [dayOnly, setDayOnly] = useState(String(dayjs().date()));
  const [isSplitted, setIsSplitted] = useState(true);
  const [envelopeId, setEnvelopeId] = useState('');
  const [errDesc, setErrDesc] = useState<string | null>(null);
  const [errAmount, setErrAmount] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDescription(data?.description ?? '');
      setTotalIncomeProcessed(
        data?.totalIncomeProcessed ? String(data.totalIncomeProcessed) : ''
      );
      if (data?.year && data?.month && data?.day) {
        setSelectedDate(
          new Date(Number(data.year), Number(data.month) - 1, Number(data.day))
        );
        setDayOnly(String(data.day));
      } else {
        setSelectedDate(new Date());
        setDayOnly(String(dayjs().date()));
      }
      setIsSplitted(data ? !!data.isSplitted : true);
      setEnvelopeId(data?.envelopeId ?? envelopes[0]?.id ?? '');
      setErrDesc(null);
      setErrAmount(null);
    }
  }, [visible, data, envelopes]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrDesc(t('income.validation.description_required'));
      return;
    }
    if (!totalIncomeProcessed.trim() || Number.isNaN(Number(totalIncomeProcessed))) {
      setErrAmount(t('income.validation.amount_required'));
      return;
    }

    const day = isDayOnly ? dayOnly || '1' : String(selectedDate.getDate());
    const month = isDayOnly
      ? String(fixedMonth)
      : String(selectedDate.getMonth() + 1);
    const year = isDayOnly
      ? String(fixedYear)
      : String(selectedDate.getFullYear());

    const payload = {
      description,
      totalIncomeProcessed,
      day,
      month,
      year,
      isSplitted: isDayOnly ? true : isSplitted,
      envelopeId: !isSplitted && !isDayOnly ? envelopeId : undefined,
    };

    if (data) {
      await updateMutation.mutateAsync({ id: data.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={t('income.title')}
      onSubmit={handleSubmit}
      submitLabel={data ? t('common.save') : t('common.add')}
      loading={createMutation.isPending || updateMutation.isPending}
      onDelete={
        data
          ? async () => {
              await deleteMutation.mutateAsync(data.id);
              onClose();
            }
          : undefined
      }
      deleteLoading={deleteMutation.isPending}
    >
      <FormInput
        label={t('income.table.headers.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        label={t('income.table.headers.amount')}
        value={totalIncomeProcessed}
        onChange={setTotalIncomeProcessed}
        error={!!errAmount}
        helperText={errAmount}
      />
      {isDayOnly ? (
        <FormInput
          label={t('settings.income.payment_day')}
          value={dayOnly}
          onChangeText={setDayOnly}
          keyboardType="numeric"
        />
      ) : (
        <>
          <DatePickerField
            label={t('envelope.transaction.date')}
            value={selectedDate}
            onChange={setSelectedDate}
          />

          <View
            style={[
              styles.splitBox,
              { borderColor: colors.border, backgroundColor: colors.background.neutral },
            ]}
          >
            <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
              {t('income.split')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <AppButton
                title={t('income.yes')}
                variant={isSplitted ? 'contained' : 'outlined'}
                onPress={() => setIsSplitted(true)}
                style={{ flex: 1, height: 40 }}
              />
              <AppButton
                title={t('income.no')}
                variant={!isSplitted ? 'contained' : 'outlined'}
                onPress={() => setIsSplitted(false)}
                style={{ flex: 1, height: 40 }}
              />
            </View>
          </View>

          {!isSplitted && (
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
                {t('income.table.headers.envelope')}
              </Text>
              <View style={styles.chipsWrap}>
                {envelopes.map((env) => {
                  const selected = env.id === envelopeId;
                  return (
                    <TouchableOpacity
                      key={env.id}
                      onPress={() => setEnvelopeId(env.id)}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: selected
                            ? colors.primary.main
                            : colors.background.neutral,
                          borderColor: selected ? colors.primary.main : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected ? '#FFF' : colors.text.primary,
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
            </View>
          )}
        </>
      )}
    </BaseFormModal>
  );
};

// ─── 3. Transaction Form Modal ────────────────────────────────────────────────

export const TransactionFormModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  envelopeId: string;
  data?: Transactions | null;
}> = ({ visible, onClose, envelopeId, data }) => {
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

    const isCredit = paymentMethod === 'envelope.transaction.payment_method.CreditCard';
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
        label={t('envelope.transaction.description')}
        placeholder={t('envelope.transaction.placeholder.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
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
                      {card.name} ({card.flag})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

      {data && (
        <>
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
        </>
      )}
    </BaseFormModal>
  );
};

// ─── 4. Envelope Limit Form Modal ─────────────────────────────────────────────

const PRESET_COLORS = [
  '#1877F2',
  '#22C55E',
  '#FFAB00',
  '#FF5630',
  '#8E33FF',
  '#00B8D9',
  '#4ECDC4',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
];

export const EnvelopeLimitFormModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data: Envelopes | null;
  allEnvelopes: Envelopes[];
}> = ({ visible, onClose, data, allEnvelopes }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const income = useIncomeStore((s) => s.income);
  const updateMutation = useUpdateEnvelopes();

  const [color, setColor] = useState('#1877F2');
  const [percentage, setPercentage] = useState(0);
  const [valueInput, setValueInput] = useState('');

  const isDebts = data?.name === 'debts';

  const usedByOthers = allEnvelopes
    .filter((e) => e.id !== data?.id)
    .reduce((sum, e) => sum + e.percentage, 0);
  const maxPercentage = Math.max(0, 100 - usedByOthers);
  const availablePercentage = Number(maxPercentage.toFixed(2));
  const maxValue = Number(((maxPercentage / 100) * income).toFixed(2));
  const isValueAboveMax = !isDebts && Number(valueInput || 0) > maxValue;

  useEffect(() => {
    if (visible && data) {
      setColor(data.color || '#1877F2');
      setPercentage(data.percentage || 0);
      if (income > 0) {
        setValueInput(((data.percentage / 100) * income).toFixed(2));
      } else {
        setValueInput('');
      }
    }
  }, [visible, data, income]);

  const handleSliderChange = (val: number) => {
    const rounded = Number(val.toFixed(2));
    setPercentage(rounded);
    if (income > 0) {
      setValueInput(((rounded / 100) * income).toFixed(2));
    }
  };

  const handleValueInputChange = (raw: string) => {
    setValueInput(raw);
    const parsed = Number.parseFloat(raw);
    if (!Number.isNaN(parsed) && income > 0) {
      const nextPct = Math.min(maxPercentage, Math.max(0, (parsed / income) * 100));
      setPercentage(Number(nextPct.toFixed(2)));
    }
  };

  const handleSubmit = async () => {
    if (!data || isValueAboveMax) return;
    await updateMutation.mutateAsync({
      id: data.id,
      name: data.name,
      color,
      percentage,
    });
    onClose();
  };

  const belowMinimum =
    data?.minAmount && income > 0 && Number(valueInput || 0) < data.minAmount;

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={data ? t(data.name) : t('settings.envelope.title')}
      onSubmit={handleSubmit}
      submitLabel={t('settings.envelope.save')}
      loading={updateMutation.isPending}
      disabled={
        isValueAboveMax ||
        (!isDebts && Number((percentage + usedByOthers).toFixed(2)) > 100)
      }
    >
      <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
        {t('settings.envelope.color')}
      </Text>
      <View style={styles.colorRow}>
        {PRESET_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorDot,
              {
                backgroundColor: c,
                borderWidth: color.toLowerCase() === c.toLowerCase() ? 3 : 0,
                borderColor: colors.text.primary,
              },
            ]}
          />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 14,
          marginBottom: 8,
        }}
      >
        <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: 14 }}>
          {t('settings.envelope.percentage', {
            count: Number(percentage.toFixed(2)),
          })}
        </Text>
        {!isDebts && (
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            {availablePercentage}% disponível
          </Text>
        )}
      </View>

      {income > 0 && !isDebts && (
        <CurrencyInput
          label={t('settings.envelope.value_input')}
          value={valueInput}
          onChange={handleValueInputChange}
          error={isValueAboveMax}
          helperText={
            isValueAboveMax
              ? t('settings.envelope.max_value_exceeded', {
                  value: fCurrency(maxValue),
                })
              : undefined
          }
        />
      )}

      {belowMinimum ? (
        <View
          style={[
            styles.warningBanner,
            { backgroundColor: colors.warning.lighter, borderColor: colors.warning.main },
          ]}
        >
          <MaterialIcons name="warning-amber" size={18} color={colors.warning.dark} />
          <Text style={{ color: colors.warning.darker, fontSize: 12, flex: 1 }}>
            {t('settings.envelope.below_minimum_amount', {
              amount: fCurrency(data?.minAmount),
            })}
          </Text>
        </View>
      ) : null}

      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={0}
        maximumValue={isDebts ? 100 : Math.max(maxPercentage, 1)}
        step={0.5}
        value={percentage}
        onValueChange={handleSliderChange}
        disabled={isDebts}
        minimumTrackTintColor={color}
        maximumTrackTintColor={colors.border}
        thumbTintColor={color}
      />
    </BaseFormModal>
  );
};

// ─── 5. Goal Form Modal (with Real-Time Recommendation Calculator) ────────────

export const GoalFormModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data?: Goals | null;
  envelope?: Envelopes;
}> = ({ visible, onClose, data, envelope }) => {
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

    if (!amountTotal.trim() || Number.isNaN(Number(amountTotal))) {
      setErrTotal(t('settings.goals.validation.amount_required'));
      valid = false;
    } else setErrTotal(null);

    if (!amount.trim() || Number.isNaN(Number(amount))) {
      setErrCurrent(t('settings.goals.validation.amount_required'));
      valid = false;
    } else setErrCurrent(null);

    if (!deadline.trim() || Number.isNaN(Number(deadline)) || Number(deadline) <= 0) {
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

    if (data) {
      await updateMutation.mutateAsync({ id: data.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
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
              await deleteMutation.mutateAsync(data.id);
              onClose();
            }
          : undefined
      }
      deleteLoading={deleteMutation.isPending}
    >
      <FormInput
        label={t('settings.goals.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        label={t('settings.goals.amount_total')}
        value={amountTotal}
        onChange={setAmountTotal}
        error={!!errTotal}
        helperText={errTotal}
      />
      <CurrencyInput
        label={t('settings.goals.amount_current')}
        value={amount}
        onChange={setAmount}
        error={!!errCurrent}
        helperText={errCurrent}
      />
      <FormInput
        label={t('settings.goals.deadline')}
        value={deadline}
        onChangeText={setDeadline}
        keyboardType="numeric"
        error={errDeadline}
        rightElement={
          <TouchableOpacity
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

      {/* Recommendation Section */}
      <View
        style={[
          styles.recContainer,
          { backgroundColor: colors.background.neutral, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.recHeader, { color: colors.text.primary }]}>
          {t('settings.goals.recommendation.title')}
        </Text>
        {salaryIdeal > income && income > 0 && (
          <Text style={{ color: colors.error.main, fontSize: 12, marginBottom: 8 }}>
            {t('settings.goals.recommendation.unfeasible', { income: fCurrency(income) })}
          </Text>
        )}
        <Text style={{ color: colors.primary.main, fontWeight: '700', fontSize: 13 }}>
          • {t('settings.goals.recommendation.monthly_save', { amount: savePerMonth.toFixed(2) })}
        </Text>
        <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4 }}>
          •{' '}
          {t('settings.goals.recommendation.envelope_percentage', {
            percentage: savePercentage.toFixed(2),
          })}
        </Text>
        <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4 }}>
          • {t('settings.goals.recommendation.ideal_income', { amount: salaryIdeal.toFixed(2) })}
        </Text>
      </View>
    </BaseFormModal>
  );
};

// ─── 6. Fixed Expense Form Modal ──────────────────────────────────────────────

export const FixedExpenseFormModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data?: FixedExpenses | null;
  envelopes: Envelopes[];
}> = ({ visible, onClose, data, envelopes }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const createMutation = useCreateFixedExpenses();
  const updateMutation = useUpdateFixedExpenses();
  const deleteMutation = useDeleteFixedExpenses();

  const selectableEnvelopes = envelopes.filter(
    (e) => e.name !== 'debts' && e.name !== 'goals'
  );

  const [envelopeId, setEnvelopeId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [errDesc, setErrDesc] = useState<string | null>(null);
  const [errAmount, setErrAmount] = useState<string | null>(null);
  const [errDay, setErrDay] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEnvelopeId(data?.envelopeId ?? selectableEnvelopes[0]?.id ?? '');
      setDescription(data?.description ?? '');
      setAmount(data?.amount ? String(data.amount) : '');
      setPaymentDay(data?.paymentDay ? String(data.paymentDay) : '');
      setErrDesc(null);
      setErrAmount(null);
      setErrDay(null);
    }
  }, [visible, data]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrDesc(t('settings.fixed_expense.validation.description_required'));
      return;
    }
    if (!amount.trim() || Number.isNaN(Number(amount))) {
      setErrAmount(t('settings.fixed_expense.validation.amount_required'));
      return;
    }
    const d = Number(paymentDay);
    if (!paymentDay.trim() || Number.isNaN(d) || d < 1 || d > 31) {
      setErrDay(t('settings.fixed_expense.validation.payment_day_range'));
      return;
    }

    if (data) {
      await updateMutation.mutateAsync({
        id: data.id,
        envelopeId,
        description,
        amount,
        paymentDay,
      });
    } else {
      await createMutation.mutateAsync({
        envelopeId,
        description,
        amount,
        paymentDay,
      });
    }
    onClose();
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
              await deleteMutation.mutateAsync(data.id);
              onClose();
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
        label={t('settings.fixed_expense.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        label={t('settings.fixed_expense.amount')}
        value={amount}
        onChange={setAmount}
        error={!!errAmount}
        helperText={errAmount}
      />
      <FormInput
        label={t('settings.fixed_expense.payment_day')}
        value={paymentDay}
        onChangeText={setPaymentDay}
        keyboardType="numeric"
        placeholder="1 - 31"
        error={errDay}
      />
    </BaseFormModal>
  );
};

// ─── 7. Debt Form Modal ───────────────────────────────────────────────────────

export const DebtFormModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data?: Debts | null;
  envelopes: Envelopes[];
}> = ({ visible, onClose, data, envelopes }) => {
  const { t } = useTranslation();
  const createMutation = useCreateDebts();
  const updateMutation = useUpdateDebts();
  const deleteMutation = useDeleteDebts();

  const debtsEnvelopeId = envelopes.find((e) => e.name === 'debts')?.id;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installmentsPaid, setInstallmentsPaid] = useState('');
  const [installmentsTotal, setInstallmentsTotal] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [errDesc, setErrDesc] = useState<string | null>(null);
  const [errAmount, setErrAmount] = useState<string | null>(null);
  const [errDay, setErrDay] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDescription(data?.description ?? '');
      setAmount(data?.amount ? String(data.amount) : '');
      setInstallmentsPaid(
        data?.installmentsPaid !== undefined ? String(data.installmentsPaid) : '0'
      );
      setInstallmentsTotal(
        data?.installmentsTotal !== undefined ? String(data.installmentsTotal) : ''
      );
      setPaymentDay(data?.paymentDay ? String(data.paymentDay) : '');
      setErrDesc(null);
      setErrAmount(null);
      setErrDay(null);
    }
  }, [visible, data]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrDesc(t('settings.debt.validation.description_required'));
      return;
    }
    if (!amount.trim() || Number.isNaN(Number(amount))) {
      setErrAmount(t('settings.debt.validation.amount_required'));
      return;
    }
    const d = Number(paymentDay);
    if (!paymentDay.trim() || Number.isNaN(d) || d < 1 || d > 31) {
      setErrDay(t('settings.debt.validation.payment_day_range'));
      return;
    }

    const payload = {
      envelopeId: debtsEnvelopeId,
      description,
      amount,
      installmentsPaid: installmentsPaid || '0',
      installmentsTotal: installmentsTotal || '1',
      paymentDay,
      status: 'debt.status.pending' as const,
    };

    if (data) {
      await updateMutation.mutateAsync({ id: data.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={t('settings.debt.title')}
      onSubmit={handleSubmit}
      submitLabel={data ? t('common.save') : t('common.add')}
      loading={createMutation.isPending || updateMutation.isPending}
      onDelete={
        data
          ? async () => {
              await deleteMutation.mutateAsync(data.id);
              onClose();
            }
          : undefined
      }
      deleteLoading={deleteMutation.isPending}
    >
      <FormInput
        label={t('settings.debt.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        label={t('settings.debt.amount')}
        value={amount}
        onChange={setAmount}
        error={!!errAmount}
        helperText={errAmount}
      />
      <FormInput
        label={t('settings.debt.installments_paid')}
        value={installmentsPaid}
        onChangeText={setInstallmentsPaid}
        keyboardType="numeric"
      />
      <FormInput
        label={t('settings.debt.installments_total')}
        value={installmentsTotal}
        onChangeText={setInstallmentsTotal}
        keyboardType="numeric"
      />
      <FormInput
        label={t('settings.debt.payment_day')}
        value={paymentDay}
        onChangeText={setPaymentDay}
        keyboardType="numeric"
        placeholder="1 - 31"
        error={errDay}
      />
    </BaseFormModal>
  );
};

// ─── 8. Credit Card Form Modal ────────────────────────────────────────────────

export const CreditCardFormModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data?: CreditCards | null;
}> = ({ visible, onClose, data }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const createMutation = useCreateCreditCards();
  const updateMutation = useUpdateCreditCards();
  const deleteMutation = useDeleteCreditCards();

  const [name, setName] = useState('');
  const [flag, setFlag] = useState<Flags>('Visa');
  const [errName, setErrName] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(data?.name ?? '');
      setFlag(data?.flag ?? 'Visa');
      setErrName(null);
    }
  }, [visible, data]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrName(t('settings.credit_card.validation.name_required'));
      return;
    }
    if (data) {
      await updateMutation.mutateAsync({
        id: data.id,
        name,
        flag,
        active: data.active,
        userId: data.userId,
      });
    } else {
      await createMutation.mutateAsync({ name, flag });
    }
    onClose();
  };

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={t('settings.credit_card.title')}
      onSubmit={handleSubmit}
      submitLabel={data ? t('common.save') : t('common.add')}
      loading={createMutation.isPending || updateMutation.isPending}
      onDelete={
        data
          ? async () => {
              await deleteMutation.mutateAsync(data.id);
              onClose();
            }
          : undefined
      }
      deleteLoading={deleteMutation.isPending}
    >
      <FormInput
        label={t('settings.credit_card.name')}
        value={name}
        onChangeText={setName}
        error={errName}
      />
      <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
        {t('settings.credit_card.flag')}
      </Text>
      <View style={styles.chipsWrap}>
        {allFlags.map((f) => {
          const active = flag === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFlag(f)}
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
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BaseFormModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '90%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  fieldTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateFieldWrapper: {
    marginBottom: 14,
  },
  dateFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  dateFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  dateFieldText: {
    fontSize: 15,
    fontWeight: '500',
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
  splitBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
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
