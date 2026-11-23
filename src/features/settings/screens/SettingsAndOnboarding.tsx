import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { AppButton, ChipTabs, FloatingAddButton } from 'src/components/FormElements';
import {
  CreditCardsSection,
  DebtsSettingsSection,
  EnvelopesLimitsSection,
  FixedExpensesSection,
  GoalsSettingsSection,
  IncomesSection,
} from 'src/components/SettingsSections';
import {
  useCompleteRegistration,
  useListCreditCards,
  useListDebts,
  useListEnvelopes,
  useListFixedExpenses,
  useListGoals,
  useListIncomes,
  useTotalIncomes,
} from 'src/hooks/useApi';
import { useIncomeStore } from 'src/store/useIncomeStore';

const STEP_KEYS = [
  'complete_registration.steps.income',
  'complete_registration.steps.fixed_expenses',
  'complete_registration.steps.debts',
  'complete_registration.steps.credit_cards',
  'complete_registration.steps.goals',
  'complete_registration.steps.envelopes',
];

export const CompleteRegistrationScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [activeStep, setActiveStep] = useState(0);
  const [addTrigger, setAddTrigger] = useState(0);

  const setIncome = useIncomeStore((s) => s.setIncome);
  const { data: totalIncomes } = useTotalIncomes();

  useEffect(() => {
    if (totalIncomes?.total != null) {
      setIncome(totalIncomes.total);
    }
  }, [totalIncomes, setIncome]);

  const { data: incomes } = useListIncomes();
  const { data: fixedExpenses } = useListFixedExpenses();
  const { data: debts } = useListDebts();
  const { data: creditCards } = useListCreditCards();
  const { data: goals } = useListGoals();
  const { data: envelopes = [] } = useListEnvelopes();

  const { mutate: completeReg, isPending } = useCompleteRegistration();

  const envelopeAllocation = useMemo(
    () =>
      Number(envelopes.reduce((acc, item) => acc + item.percentage, 0).toFixed(2)),
    [envelopes]
  );

  const canFinish = envelopeAllocation === 100;
  const isLastStep = activeStep === STEP_KEYS.length - 1;

  const stepIcons: (keyof typeof MaterialIcons.glyphMap)[] = [
    'attach-money',
    'receipt-long',
    'account-balance',
    'credit-card',
    'savings',
    'mail',
  ];

  const tabs = STEP_KEYS.map((key, index) => ({
    label: t(key),
    index,
    icon: stepIcons[index],
  }));

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <IncomesSection
            items={incomes?.data ?? []}
            addTrigger={addTrigger}
          />
        );
      case 1:
        return (
          <FixedExpensesSection
            items={fixedExpenses?.data ?? []}
            envelopes={envelopes}
            addTrigger={addTrigger}
          />
        );
      case 2:
        return (
          <DebtsSettingsSection
            items={debts?.data ?? []}
            envelopes={envelopes}
            addTrigger={addTrigger}
          />
        );
      case 3:
        return (
          <CreditCardsSection
            items={creditCards?.data ?? []}
            addTrigger={addTrigger}
          />
        );
      case 4:
        return (
          <GoalsSettingsSection
            items={goals?.data ?? []}
            goalsEnvelope={envelopes.find((e) => e.name === 'goals')}
            addTrigger={addTrigger}
          />
        );
      case 5:
        return (
          <EnvelopesLimitsSection
            envelopes={envelopes}
            addTrigger={addTrigger}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {t('complete_registration.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {t('complete_registration.subtitle')}
        </Text>

        {!canFinish && (
          <View
            style={[
              styles.warningBox,
              { backgroundColor: colors.warning.main },
            ]}
          >
            <MaterialIcons
              name="warning-amber"
              size={20}
              color={colors.warning.contrastText}
            />
            <Text
              style={[
                styles.warningText,
                { color: colors.warning.contrastText },
              ]}
            >
              {t('complete_registration.allocation_warning')}
            </Text>
          </View>
        )}

        <ChipTabs
          tabs={tabs}
          activeIndex={activeStep}
          onChange={setActiveStep}
        />
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.content}>
          {renderStepContent()}
        </ScrollView>
        <FloatingAddButton
          onPress={() => setAddTrigger((prev) => prev + 1)}
        />
      </View>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background.paper,
            borderTopColor: colors.border,
            paddingBottom: 14 + Math.max(insets.bottom, 12),
          },
        ]}
      >
        <AppButton
          title={t('complete_registration.back')}
          variant="outlined"
          disabled={activeStep === 0 || isPending}
          onPress={() => setActiveStep((prev) => Math.max(0, prev - 1))}
          style={{ flex: 1 }}
        />

        {!isLastStep ? (
          <AppButton
            title={t('complete_registration.continue')}
            onPress={() => setActiveStep((prev) => prev + 1)}
            disabled={isPending}
            style={{ flex: 1 }}
          />
        ) : (
          <AppButton
            title={t('complete_registration.finish')}
            onPress={() => {
              if (canFinish) completeReg();
            }}
            disabled={!canFinish || isPending}
            loading={isPending}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </View>
  );
};

export const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [addTrigger, setAddTrigger] = useState(0);

  const { data: incomes } = useListIncomes();
  const { data: envelopes = [] } = useListEnvelopes();
  const { data: goals } = useListGoals();
  const { data: fixedExpenses } = useListFixedExpenses();
  const { data: debts } = useListDebts();
  const { data: creditCards } = useListCreditCards();

  const tabs: {
    label: string;
    index: number;
    icon: keyof typeof MaterialIcons.glyphMap;
  }[] = [
    { label: t('settings.tabs.income'), index: 0, icon: 'attach-money' },
    { label: t('settings.tabs.envelopes'), index: 1, icon: 'mail' },
    { label: t('settings.tabs.goals'), index: 2, icon: 'savings' },
    { label: t('settings.tabs.fixed_expenses'), index: 3, icon: 'receipt-long' },
    { label: t('settings.tabs.debts'), index: 4, icon: 'account-balance' },
    { label: t('settings.tabs.credit_cards'), index: 5, icon: 'credit-card' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <IncomesSection
            items={incomes?.data ?? []}
            addTrigger={addTrigger}
          />
        );
      case 1:
        return (
          <EnvelopesLimitsSection
            envelopes={envelopes}
            addTrigger={addTrigger}
          />
        );
      case 2:
        return (
          <GoalsSettingsSection
            items={goals?.data ?? []}
            goalsEnvelope={envelopes.find((e) => e.name === 'goals')}
            addTrigger={addTrigger}
          />
        );
      case 3:
        return (
          <FixedExpensesSection
            items={fixedExpenses?.data ?? []}
            envelopes={envelopes}
            addTrigger={addTrigger}
          />
        );
      case 4:
        return (
          <DebtsSettingsSection
            items={debts?.data ?? []}
            envelopes={envelopes}
            addTrigger={addTrigger}
          />
        );
      case 5:
        return (
          <CreditCardsSection
            items={creditCards?.data ?? []}
            addTrigger={addTrigger}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      <View style={styles.settingsHeader}>
        <ChipTabs
          tabs={tabs}
          activeIndex={activeTab}
          onChange={setActiveTab}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>
      <FloatingAddButton
        onPress={() => setAddTrigger((prev) => prev + 1)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  settingsHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  contentWrapper: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 90,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
