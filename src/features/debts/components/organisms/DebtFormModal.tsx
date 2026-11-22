import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseFormModal, CurrencyInput, FormInput } from 'src/shared/ui';
import {
  useCreateDebts,
  useDeleteDebts,
  useUpdateDebts,
} from 'src/features/debts/api/useDebtsApi';
import { Debts, Envelopes } from 'src/types';

export interface DebtFormModalProps {
  visible: boolean;
  onClose: () => void;
  data?: Debts | null;
  envelopes: Envelopes[];
}

export const DebtFormModal: React.FC<DebtFormModalProps> = ({
  visible,
  onClose,
  data,
  envelopes,
}) => {
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
        data?.installmentsPaid !== undefined
          ? String(data.installmentsPaid)
          : '0'
      );
      setInstallmentsTotal(
        data?.installmentsTotal !== undefined
          ? String(data.installmentsTotal)
          : ''
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
        testID="debt-description-input"
        label={t('settings.debt.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        testID="debt-amount-input"
        label={t('settings.debt.amount')}
        value={amount}
        onChange={setAmount}
        error={!!errAmount}
        helperText={errAmount}
      />
      <FormInput
        testID="debt-installments-paid-input"
        label={t('settings.debt.installments_paid')}
        value={installmentsPaid}
        onChangeText={setInstallmentsPaid}
        keyboardType="numeric"
      />
      <FormInput
        testID="debt-installments-total-input"
        label={t('settings.debt.installments_total')}
        value={installmentsTotal}
        onChangeText={setInstallmentsTotal}
        keyboardType="numeric"
      />
      <FormInput
        testID="debt-payment-day-input"
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
