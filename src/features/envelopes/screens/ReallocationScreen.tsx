import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { useSelectedMonthYearStore } from 'src/store/useSelectedMonthYearStore';
import {
  useListEnvelopes,
  useListEnvelopesWithAmount,
  useTransferBalance,
} from 'src/features/envelopes/api/useEnvelopesApi';
import { RealEnvelopeCard } from 'src/features/envelopes/components/molecules/RealEnvelopeCard';
import { AppButton, CurrencyInput, KeyboardAvoidingContainer } from 'src/shared/ui';

export const ReallocationScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { month, year, lastSlideIndex } = useSelectedMonthYearStore();
  const { data: monthlyEnvelopes = [] } = useListEnvelopesWithAmount(year, month);
  const { data: allEnvelopes = [] } = useListEnvelopes();
  const transferMutation = useTransferBalance();

  const mergedEnvelopes = useMemo(() => {
    const monthlyById = new Map(monthlyEnvelopes.map((e) => [e.id, e]));
    const base = allEnvelopes.length > 0 ? allEnvelopes : monthlyEnvelopes;
    return base.map((env) => {
      const monthly = monthlyById.get(env.id);
      return {
        ...env,
        amount: monthly?.amount ?? 0,
        used: monthly?.used ?? 0,
      };
    });
  }, [allEnvelopes, monthlyEnvelopes]);

  // Only envelopes with balance > 0 can be selected as source
  const sourceEnvelopes = useMemo(
    () => mergedEnvelopes.filter((e) => Number(e.amount ?? 0) > 0),
    [mergedEnvelopes]
  );

  const initialSlideIndex = route?.params?.initialIndex ?? lastSlideIndex ?? 0;
  const initialEnvId = monthlyEnvelopes[initialSlideIndex]?.id;

  const [sourceIndex, setSourceIndex] = useState(() => {
    if (initialEnvId) {
      const idx = sourceEnvelopes.findIndex((e) => e.id === initialEnvId);
      if (idx >= 0) return idx;
    }
    return 0;
  });
  const [destIndex, setDestIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const safeSourceIndex =
    sourceEnvelopes.length > 0
      ? Math.min(Math.max(0, sourceIndex), sourceEnvelopes.length - 1)
      : 0;
  const sourceEnvelope = sourceEnvelopes[safeSourceIndex];
  const destinationEnvelopes = mergedEnvelopes.filter(
    (e) => e.id !== sourceEnvelope?.id
  );
  const safeDestIndex =
    destinationEnvelopes.length > 0
      ? Math.min(Math.max(0, destIndex), destinationEnvelopes.length - 1)
      : 0;
  const destinationEnvelope =
    destinationEnvelopes[safeDestIndex] || destinationEnvelopes[0];

  const numAmount = Number(amount || 0);
  const insufficientFunds =
    sourceEnvelope && numAmount > (sourceEnvelope.amount || 0);

  const handleTransfer = () => {
    if (!sourceEnvelope || !destinationEnvelope) return;
    if (numAmount <= 0) {
      setError(t('envelope.validation.amount_positive'));
      return;
    }
    if (insufficientFunds) {
      setError(t('envelope.validation.insufficient_funds'));
      return;
    }

    transferMutation.mutate(
      {
        fromEnvelopeId: sourceEnvelope.id,
        toEnvelopeId: destinationEnvelope.id,
        amount: numAmount,
        year,
        month,
      },
      {
        onSuccess: () => navigation.goBack(),
      }
    );
  };

  return (
    <KeyboardAvoidingContainer
      style={[styles.container, { backgroundColor: colors.background.default }]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
      <View
        style={[
          styles.reallocCard,
          {
            backgroundColor: colors.background.paper,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '800',
            color: colors.text.primary,
            marginBottom: 16,
          }}
        >
          {t('envelope.transfer.title')}
        </Text>

        <Text style={[styles.reallocLabel, { color: colors.text.secondary }]}>
          {t('envelope.transfer.from')}
        </Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity
            disabled={sourceEnvelopes.length <= 1}
            onPress={() => {
              if (sourceEnvelopes.length <= 1) return;
              setSourceIndex((prev: number) => {
                const current = Math.min(Math.max(0, prev), sourceEnvelopes.length - 1);
                return current === 0 ? sourceEnvelopes.length - 1 : current - 1;
              });
            }}
            style={styles.arrowCircle}
          >
            <MaterialIcons
              name="chevron-left"
              size={28}
              color={colors.text.primary}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            {sourceEnvelope && (
              <RealEnvelopeCard
                envelope={sourceEnvelope}
                activeCard
                fullWidth
              />
            )}
          </View>
          <TouchableOpacity
            disabled={sourceEnvelopes.length <= 1}
            onPress={() => {
              if (sourceEnvelopes.length <= 1) return;
              setSourceIndex((prev: number) => {
                const current = Math.min(Math.max(0, prev), sourceEnvelopes.length - 1);
                return current === sourceEnvelopes.length - 1 ? 0 : current + 1;
              });
            }}
            style={styles.arrowCircle}
          >
            <MaterialIcons
              name="chevron-right"
              size={28}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        <MaterialIcons
          name="arrow-downward"
          size={28}
          color={colors.text.disabled}
          style={{ alignSelf: 'center', marginVertical: 10 }}
        />

        <Text style={[styles.reallocLabel, { color: colors.text.secondary }]}>
          {t('envelope.transfer.to')}
        </Text>
        <View style={[styles.selectorRow, { marginBottom: 20 }]}>
          <TouchableOpacity
            disabled={destinationEnvelopes.length <= 1}
            onPress={() => {
              if (destinationEnvelopes.length <= 1) return;
              setDestIndex((prev) => {
                const current = Math.min(
                  Math.max(0, prev),
                  destinationEnvelopes.length - 1
                );
                return current === 0 ? destinationEnvelopes.length - 1 : current - 1;
              });
            }}
            style={styles.arrowCircle}
          >
            <MaterialIcons
              name="chevron-left"
              size={28}
              color={colors.text.primary}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            {destinationEnvelope && (
              <RealEnvelopeCard
                envelope={destinationEnvelope}
                activeCard
                fullWidth
              />
            )}
          </View>
          <TouchableOpacity
            disabled={destinationEnvelopes.length <= 1}
            onPress={() => {
              if (destinationEnvelopes.length <= 1) return;
              setDestIndex((prev) => {
                const current = Math.min(
                  Math.max(0, prev),
                  destinationEnvelopes.length - 1
                );
                return current === destinationEnvelopes.length - 1 ? 0 : current + 1;
              });
            }}
            style={styles.arrowCircle}
          >
            <MaterialIcons
              name="chevron-right"
              size={28}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        <CurrencyInput
          label={t('envelope.transfer.amount_label')}
          value={amount}
          onChange={(val) => {
            setAmount(val);
            setError(null);
          }}
          error={!!error || !!insufficientFunds}
          helperText={
            error ||
            (insufficientFunds
              ? t('envelope.validation.insufficient_funds')
              : null)
          }
        />

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <AppButton
            title={t('common.back')}
            variant="outlined"
            onPress={() => navigation.goBack()}
            style={{ flex: 1 }}
          />
          <AppButton
            title={t('common.transfer')}
            onPress={handleTransfer}
            loading={transferMutation.isPending}
            disabled={
              !sourceEnvelope ||
              !destinationEnvelope ||
              numAmount <= 0 ||
              !!insufficientFunds
            }
            style={{ flex: 1 }}
          />
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reallocCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  reallocLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowCircle: {
    padding: 4,
  },
});
