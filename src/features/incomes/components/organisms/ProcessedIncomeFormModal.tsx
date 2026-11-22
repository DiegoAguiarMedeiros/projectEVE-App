import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAppTheme } from 'src/theme';
import {
  AppButton,
  BaseFormModal,
  CurrencyInput,
  DatePickerField,
  FormInput,
} from 'src/shared/ui';
import {
  useCreateProcessedIncomes,
  useDeleteProcessedIncomes,
  useUpdateProcessedIncomes,
} from 'src/features/incomes/api/useIncomesApi';
import { Envelopes, ProcessedIncomes } from 'src/types';

export interface ProcessedIncomeFormModalProps {
  visible: boolean;
  onClose: () => void;
  data?: ProcessedIncomes | null;
  envelopes: Envelopes[];
  fixedMonth?: number;
  fixedYear?: number;
}

export const ProcessedIncomeFormModal: React.FC<
  ProcessedIncomeFormModalProps
> = ({ visible, onClose, data, envelopes, fixedMonth, fixedYear }) => {
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
  const [errDay, setErrDay] = useState<string | null>(null);

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
      setEnvelopeId(data?.envelopeId ?? '');
      setErrDesc(null);
      setErrAmount(null);
      setErrDay(null);
    }
  }, [visible, data]);

  useEffect(() => {
    if (visible && !envelopeId && envelopes.length > 0) {
      setEnvelopeId(envelopes[0].id);
    }
  }, [visible, envelopeId, envelopes]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrDesc(t('income.validation.description_required'));
      return;
    }
    setErrDesc(null);

    if (
      !totalIncomeProcessed.trim() ||
      Number.isNaN(Number(totalIncomeProcessed)) ||
      Number(totalIncomeProcessed) <= 0
    ) {
      setErrAmount(t('income.validation.amount_required'));
      return;
    }
    setErrAmount(null);

    if (isDayOnly) {
      const parsedDay = Number(dayOnly);
      if (!dayOnly.trim() || Number.isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
        setErrDay(t('settings.income.validation.payment_day_range'));
        return;
      }
      setErrDay(null);
    }

    const day = isDayOnly ? String(Number(dayOnly)) : String(selectedDate.getDate());
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
      title={t('income.title')}
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
        testID="processed-income-description-input"
        label={t('income.table.headers.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        testID="processed-income-amount-input"
        label={t('income.table.headers.amount')}
        value={totalIncomeProcessed}
        onChange={setTotalIncomeProcessed}
        error={!!errAmount}
        helperText={errAmount}
      />
      {isDayOnly ? (
        <FormInput
          testID="processed-income-day-input"
          label={t('settings.income.payment_day')}
          value={dayOnly}
          onChangeText={setDayOnly}
          keyboardType="numeric"
          error={errDay}
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
              {
                borderColor: colors.border,
                backgroundColor: colors.background.neutral,
              },
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
                          borderColor: selected
                            ? colors.primary.main
                            : colors.border,
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
  splitBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
});
