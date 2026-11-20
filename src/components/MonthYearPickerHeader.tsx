import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { useDeleteProcessedIncomesByMonth, useProcessedIncomesMonth } from 'src/hooks/useApi';
import { Month } from 'src/types';

export const MonthYearPickerHeader: React.FC<{ disabled?: boolean }> = ({
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { month, year, setMonth, setYear } = useSelectedMonthYearStore();
  const { data: processedData = {} } = useProcessedIncomesMonth();
  const deleteByMonthMutation = useDeleteProcessedIncomesByMonth();

  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const months = [
    t('months.january'),
    t('months.february'),
    t('months.march'),
    t('months.april'),
    t('months.may'),
    t('months.june'),
    t('months.july'),
    t('months.august'),
    t('months.september'),
    t('months.october'),
    t('months.november'),
    t('months.december'),
  ];

  const processedYears = Object.keys(processedData)
    .map(Number)
    .sort((a, b) => a - b);

  const currentYear = new Date().getFullYear();
  const yearRangeStart = processedYears.length > 0 ? Math.min(processedYears[0], currentYear - 1) : currentYear - 1;
  const yearRangeEnd =
    processedYears.length > 0
      ? Math.max(processedYears[processedYears.length - 1] + 1, currentYear + 1)
      : currentYear + 1;

  const allYears = Array.from(
    { length: yearRangeEnd - yearRangeStart + 1 },
    (_, i) => yearRangeStart + i
  );

  const isMonthProcessed = (y: number, m: number): boolean => {
    return (processedData[y] || []).includes(m as Month);
  };

  const isSelectedMonthProcessed = isMonthProcessed(year, month);

  const handlePrevMonth = () => {
    if (disabled) return;
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth((month - 1) as Month);
    }
  };

  const handleNextMonth = () => {
    if (disabled) return;
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth((month + 1) as Month);
    }
  };

  return (
    <View style={[styles.container, disabled && { opacity: 0.45 }]}>
      <TouchableOpacity
        disabled={disabled}
        onPress={handlePrevMonth}
        style={styles.arrowBtn}
      >
        <MaterialIcons
          name="chevron-left"
          size={24}
          color={disabled ? colors.text.disabled : colors.text.primary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        disabled={disabled}
        style={[
          styles.mainBtn,
          {
            backgroundColor: disabled
              ? colors.text.disabled
              : colors.primary.main,
          },
        ]}
        onPress={() => {
          if (!disabled) setModalVisible(true);
        }}
      >
        <MaterialIcons
          name={disabled ? 'lock' : 'calendar-today'}
          size={14}
          color="#FFF"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.mainBtnText}>
          {months[month - 1]} / {year}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        disabled={disabled}
        onPress={handleNextMonth}
        style={styles.arrowBtn}
      >
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={disabled ? colors.text.disabled : colors.text.primary}
        />
      </TouchableOpacity>

      {/* Month/Year Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.background.paper, borderColor: colors.border },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Year Selector Row */}
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
              {t('months.january') ? 'Ano / Year' : 'Year'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.yearsRow}
            >
              {allYears.map((y) => {
                const active = y === year;
                return (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setYear(y)}
                    style={[
                      styles.yearChip,
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
                        fontWeight: '700',
                      }}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 3x4 Grid of Months */}
            <View style={styles.monthsGrid}>
              {months.map((mName, idx) => {
                const mNum = (idx + 1) as Month;
                const processed = isMonthProcessed(year, mNum);
                const selected = mNum === month;
                return (
                  <TouchableOpacity
                    key={mName}
                    onPress={() => {
                      setMonth(mNum);
                      setModalVisible(false);
                    }}
                    style={[
                      styles.monthCell,
                      {
                        backgroundColor: selected
                          ? colors.primary.main
                          : colors.background.neutral,
                        borderColor: processed
                          ? colors.primary.main
                          : colors.border,
                        opacity: processed || selected ? 1 : 0.55,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontWeight: selected || processed ? '700' : '500',
                        color: selected ? '#FFF' : colors.text.primary,
                      }}
                    >
                      {mName.slice(0, 3)}
                    </Text>
                    {processed && !selected && (
                      <View
                        style={[
                          styles.processedDot,
                          { backgroundColor: colors.success.main },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Delete Processed Month Button */}
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <TouchableOpacity
              disabled={!isSelectedMonthProcessed}
              onPress={() => setConfirmDeleteVisible(true)}
              style={[
                styles.deleteMonthBtn,
                {
                  borderColor: isSelectedMonthProcessed
                    ? colors.error.main
                    : colors.border,
                  opacity: isSelectedMonthProcessed ? 1 : 0.4,
                },
              ]}
            >
              <MaterialIcons
                name="delete-outline"
                size={18}
                color={isSelectedMonthProcessed ? colors.error.main : colors.text.disabled}
              />
              <Text
                style={{
                  color: isSelectedMonthProcessed
                    ? colors.error.main
                    : colors.text.disabled,
                  fontWeight: '700',
                  marginLeft: 6,
                }}
              >
                {t('overview.delete_month.button')} {months[month - 1]}/{year}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirm Delete Month Dialog */}
      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.background.paper, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>
              {t('overview.delete_month.confirm_title')}
            </Text>
            <Text style={[styles.confirmMsg, { color: colors.text.secondary }]}>
              {t('overview.delete_month.confirm_message', { month, year })}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text style={{ color: colors.text.primary, fontWeight: '600' }}>
                  {t('overview.delete_month.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, { backgroundColor: colors.error.main }]}
                disabled={deleteByMonthMutation.isPending}
                onPress={() => {
                  deleteByMonthMutation.mutate(
                    { year, month },
                    {
                      onSuccess: () => {
                        setConfirmDeleteVisible(false);
                        setModalVisible(false);
                      },
                    }
                  );
                }}
              >
                {deleteByMonthMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>
                    {t('overview.delete_month.confirm')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtn: {
    padding: 6,
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  mainBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  yearsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  processedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 4,
    right: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  deleteMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  confirmMsg: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmDeleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
});
