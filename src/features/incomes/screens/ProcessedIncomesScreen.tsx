import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { useSelectedMonthYearStore } from 'src/store/useSelectedMonthYearStore';
import { useListEnvelopesWithAmount } from 'src/features/envelopes/api/useEnvelopesApi';
import {
  useProcessedIncomes,
  useTotalProcessedIncomes,
} from 'src/features/incomes/api/useIncomesApi';
import { ProcessedIncomeFormModal } from 'src/features/incomes/components/organisms/ProcessedIncomeFormModal';
import { FloatingAddButton, ItemRow } from 'src/shared/ui';
import { ProcessedIncomes } from 'src/types';
import { fCurrency, fDate } from 'src/utils/format';

export const ProcessedIncomesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { month, year } = useSelectedMonthYearStore();

  const { data: envelopes = [] } = useListEnvelopesWithAmount(year, month);
  const { data: processedData } = useProcessedIncomes(year, month);
  const { data: totalProcessed } = useTotalProcessedIncomes(year, month);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessedIncomes | null>(null);

  const items = processedData?.data ?? [];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.default }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.totalBanner,
            {
              backgroundColor: colors.background.paper,
              borderColor: colors.border,
            },
          ]}
        >
          <View>
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>
              {t('income.table.total')}
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: colors.success.main,
                marginTop: 2,
              }}
            >
              {fCurrency(totalProcessed?.total ?? 0)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.listCard,
            {
              backgroundColor: colors.background.paper,
              borderColor: colors.border,
            },
          ]}
        >
          {items.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {t('income.table.empty')}
            </Text>
          ) : (
            items.map((item, idx) => (
              <ItemRow
                key={item.id}
                hideDivider={idx === items.length - 1}
                avatarBg={colors.success.lighter}
                avatarIcon="arrow-downward"
                avatarIconColor={colors.success.main}
                title={item.description}
                subtitle={
                  <>
                    <Text
                      style={{ fontSize: 12, color: colors.text.secondary }}
                    >
                      {fDate(
                        `${item.year}-${String(item.month).padStart(2, '0')}-${String(
                          item.day
                        ).padStart(2, '0')}`
                      )}
                    </Text>
                    <View
                      style={[
                        styles.statusChip,
                        { borderColor: colors.info.main },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: colors.info.main,
                        }}
                      >
                        {item.isSplitted
                          ? t('income.table.all')
                          : t('income.table.one')}
                      </Text>
                    </View>
                  </>
                }
                amount={
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.success.main,
                    }}
                  >
                    + {fCurrency(item.totalIncomeProcessed)}
                  </Text>
                }
                onPress={() => {
                  setEditing(item);
                  setModalOpen(true);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <FloatingAddButton
        onPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      />

      <ProcessedIncomeFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        data={editing}
        envelopes={envelopes}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  listCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 30,
    fontSize: 14,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
