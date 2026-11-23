import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { BaseFormModal, CurrencyInput, FormInput } from 'src/shared/ui';
import {
  useCreateEnvelopes,
  useDeleteEnvelopes,
  useUpdateEnvelopes,
} from 'src/features/envelopes/api/useEnvelopesApi';
import { useIncomeStore } from 'src/store/useIncomeStore';
import { Envelopes } from 'src/types';
import { fCurrency } from 'src/utils/format';

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

export interface EnvelopeLimitFormModalProps {
  visible: boolean;
  onClose: () => void;
  data: Envelopes | null;
  allEnvelopes: Envelopes[];
}

export const EnvelopeLimitFormModal: React.FC<EnvelopeLimitFormModalProps> = ({
  visible,
  onClose,
  data,
  allEnvelopes,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const income = useIncomeStore((s) => s.income);
  const createMutation = useCreateEnvelopes();
  const updateMutation = useUpdateEnvelopes();
  const deleteMutation = useDeleteEnvelopes();

  const [name, setName] = useState('');
  const [errName, setErrName] = useState<string | null>(null);
  const [color, setColor] = useState('#1877F2');
  const [percentage, setPercentage] = useState(0);
  const [valueInput, setValueInput] = useState('');

  const isEditing = Boolean(data?.id);
  const isDebts = data?.name === 'debts';
  const isProtected = data?.name === 'debts' || data?.name === 'goals';

  const usedByOthers = allEnvelopes
    .filter((e) => e.id !== data?.id)
    .reduce((sum, e) => sum + e.percentage, 0);
  const maxPercentage = Math.max(0, 100 - usedByOthers);
  const availablePercentage = Number(maxPercentage.toFixed(2));
  const maxValue = Number(((maxPercentage / 100) * income).toFixed(2));
  const isValueAboveMax = !isDebts && Number(valueInput || 0) > maxValue;

  useEffect(() => {
    if (visible) {
      if (data) {
        setName(data.name);
        setColor(data.color || '#1877F2');
        setPercentage(data.percentage || 0);
        const currentIncome = useIncomeStore.getState().income;
        if (currentIncome > 0) {
          setValueInput((((data.percentage || 0) / 100) * currentIncome).toFixed(2));
        } else {
          setValueInput('');
        }
      } else {
        setName('');
        setColor('#1877F2');
        setPercentage(0);
        setValueInput('');
      }
      setErrName(null);
    }
  }, [visible, data]);

  const handleSliderChange = (val: number) => {
    const rounded = Number(val.toFixed(2));
    setPercentage(rounded);
    if (income > 0) {
      setValueInput(((rounded / 100) * income).toFixed(2));
    }
  };

  const handleValueInputChange = (raw: string) => {
    setValueInput(raw);
    if (raw === '') {
      setPercentage(0);
      return;
    }
    const parsed = Number.parseFloat(raw);
    if (!Number.isNaN(parsed) && income > 0) {
      const nextPct = Math.min(
        maxPercentage,
        Math.max(0, (parsed / income) * 100)
      );
      setPercentage(nextPct);
    }
  };

  const handleSubmit = async () => {
    if (isValueAboveMax) return;
    if (!isEditing) {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        setErrName(t('settings.envelope.validation.name_required'));
        return;
      }
      setErrName(null);
    }

    try {
      if (isEditing && data) {
        await updateMutation.mutateAsync({
          id: data.id,
          name: data.name,
          color,
          percentage,
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          color,
          percentage,
          order: allEnvelopes.length + 1,
        });
      }
      onClose();
    } catch {
      // handled by mutation onError toast
    }
  };

  const handleDelete = async () => {
    if (!data?.id || isProtected) return;
    try {
      await deleteMutation.mutateAsync(data.id);
      onClose();
    } catch {
      // handled by mutation onError toast
    }
  };

  const belowMinimum =
    data?.minAmount && income > 0 && Number(valueInput || 0) < data.minAmount;

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={data ? t(data.name) : t('settings.envelope.title')}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? t('settings.envelope.save') : t('common.add')}
      loading={createMutation.isPending || updateMutation.isPending}
      onDelete={isEditing && !isProtected ? handleDelete : undefined}
      deleteLoading={deleteMutation.isPending}
      disabled={
        isValueAboveMax ||
        (!isDebts && Number((percentage + usedByOthers).toFixed(2)) > 100)
      }
    >
      {!isEditing && (
        <FormInput
          testID="envelope-name-input"
          label={t('settings.envelope.name')}
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (errName) setErrName(null);
          }}
          error={errName}
        />
      )}
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
        <Text
          style={{
            color: colors.text.primary,
            fontWeight: '700',
            fontSize: 14,
          }}
        >
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
          testID="envelope-value-input"
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
          />
          <Text
            style={{ color: colors.warning.darker, fontSize: 12, flex: 1 }}
          >
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

const styles = StyleSheet.create({
  fieldTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
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
});
