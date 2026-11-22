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
  const [errPaid, setErrPaid] = useState<string | null>(null);
  const [errTotal, setErrTotal] = useState<string | null>(null);
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
      setErrPaid(null);
      setErrTotal(null);
      setErrDay(null);
    }
  }, [visible, data]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrDesc(t('settings.debt.validation.description_required'));
      return;
    }
    setErrDesc(null);

    if (!amount.trim() || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrAmount(t('settings.debt.validation.amount_required'));
      return;
    }
    setErrAmount(null);

    const totalNum = Number(installmentsTotal || '1');
    if (
      !installmentsTotal.trim() ||
      Number.isNaN(totalNum) ||
      !Number.isInteger(totalNum) ||
      totalNum < 1
    ) {
      setErrTotal(t('settings.debt.validation.installments_total_invalid'));
      return;
    }
    setErrTotal(null);

    const paidNum = Number(installmentsPaid || '0');
    if (
      Number.isNaN(paidNum) ||
      !Number.isInteger(paidNum) ||
      paidNum < 0 ||
      paidNum > totalNum
    ) {
      setErrPaid(t('settings.debt.validation.installments_paid_invalid'));
      return;
    }
    setErrPaid(null);

    const d = Number(paymentDay);
    if (!paymentDay.trim() || Number.isNaN(d) || d < 1 || d > 31) {
      setErrDay(t('settings.debt.validation.payment_day_range'));
      return;
    }
    setErrDay(null);

    const payload = {
      envelopeId: debtsEnvelopeId,
      description,
      amount,
      installmentsPaid: String(paidNum),
      installmentsTotal: String(totalNum),
      paymentDay,
      status: 'debt.status.pending' as const,
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
      title={t('settings.debt.title')}
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
        error={errPaid}
      />
      <FormInput
        testID="debt-installments-total-input"
        label={t('settings.debt.installments_total')}
        value={installmentsTotal}
        onChangeText={setInstallmentsTotal}
        keyboardType="numeric"
        error={errTotal}
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
