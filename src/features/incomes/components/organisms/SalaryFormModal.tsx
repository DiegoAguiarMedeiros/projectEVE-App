import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BaseFormModal,
  CurrencyInput,
  FormInput,
} from 'src/shared/ui';
import {
  useCreateIncomes,
  useDeleteIncomes,
  useUpdateIncomes,
} from 'src/features/incomes/api/useIncomesApi';
import { Incomes } from 'src/types';

export interface SalaryFormModalProps {
  visible: boolean;
  onClose: () => void;
  data?: Incomes | null;
}

export const SalaryFormModal: React.FC<SalaryFormModalProps> = ({
  visible,
  onClose,
  data,
}) => {
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
        testID="salary-description-input"
        label={t('settings.income.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        testID="salary-amount-input"
        label={t('settings.income.amount')}
        value={amount}
        onChange={setAmount}
        error={!!errAmount}
        helperText={errAmount}
      />
      <FormInput
        testID="salary-payment-day-input"
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
