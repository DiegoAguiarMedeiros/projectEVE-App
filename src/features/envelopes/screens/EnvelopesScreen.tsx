import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { useSelectedMonthYearStore } from 'src/store/useSelectedMonthYearStore';
import { useListEnvelopesWithAmount } from 'src/features/envelopes/api/useEnvelopesApi';
import {
  useListTransactionsByEnvelope,
  useUpdateStatusTransactions,
} from 'src/features/transactions/api/useTransactionsApi';
import { RealEnvelopeCard } from 'src/features/envelopes/components/molecules/RealEnvelopeCard';
import { TransactionsListSkeleton } from 'src/features/transactions/components/molecules/TransactionsListSkeleton';
import { TransactionFormModal } from 'src/features/transactions/components/organisms/TransactionFormModal';
import { groupTransactionsByDate } from 'src/features/transactions/utils/groupTransactionsByDate';
import { ItemRow } from 'src/shared/ui';
import { Transactions } from 'src/types';
import { fCurrency } from 'src/utils/format';

const CARD_GAP = 14;

export const EnvelopesScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const { month, year, lastSlideIndex, setLastSlideIndex } =
    useSelectedMonthYearStore();

  const cardWidth = Math.min(windowWidth * 0.72, 270);
  const snapInterval = cardWidth + CARD_GAP;
  const sidePadding = (windowWidth - cardWidth) / 2;

  const carouselRef = useRef<ScrollView>(null);
  const hasInitializedScroll = useRef(false);

  const { data: envelopes = [], isLoading: isLoadingEnvelopes } =
    useListEnvelopesWithAmount(year, month);
  const [currentIndex, setCurrentIndex] = useState(lastSlideIndex);
  const [typeFilter, setTypeFilter] = useState<'both' | 'Debit' | 'Credit'>(
    'both'
  );

  const [addTxOpen, setAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transactions | null>(null);
  const [fabExpanded, setFabExpanded] = useState(false);

  useEffect(() => {
    if (envelopes.length > 0 && currentIndex >= envelopes.length) {
      setCurrentIndex(0);
      setLastSlideIndex(0);
      carouselRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [envelopes.length, currentIndex, setLastSlideIndex]);

  const handleCarouselContentSizeChange = () => {
    if (!hasInitializedScroll.current && envelopes.length > 0) {
      hasInitializedScroll.current = true;
      const safeIndex = Math.min(
        Math.max(currentIndex, 0),
        envelopes.length - 1
      );
      carouselRef.current?.scrollTo({
        x: safeIndex * snapInterval,
        animated: false,
      });
    }
  };

  const handleCarouselMomentumEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    if (envelopes.length === 0) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const nextIndex = Math.min(
      Math.max(Math.round(offsetX / snapInterval), 0),
      envelopes.length - 1
    );
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
      setLastSlideIndex(nextIndex);
    }
  };

  const handleSelectEnvelope = (idx: number) => {
    setCurrentIndex(idx);
    setLastSlideIndex(idx);
    carouselRef.current?.scrollTo({
      x: idx * snapInterval,
      animated: true,
    });
  };

  const activeEnvelope = envelopes[currentIndex] || envelopes[0];
  const activeEnvelopeId = activeEnvelope?.id || '';

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isFetching: isFetchingTransactions,
  } = useListTransactionsByEnvelope(activeEnvelopeId, year, month, {
    type: typeFilter === 'both' ? undefined : typeFilter,
  });

  const updateStatusMutation = useUpdateStatusTransactions();

  const getTranslatedDescription = (desc: string, isTranslatable?: boolean) => {
    if (!isTranslatable) return desc;
    const [key, arg] = desc.split('|');
    if (arg) return t(key, { name: arg });
    return t(key);
  };

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(transactionsData?.data ?? [], t),
    [transactionsData, t]
  );

  const isLoadingList =
    isLoadingEnvelopes ||
    isLoadingTransactions ||
    (isFetchingTransactions && groupedTransactions.length === 0);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.default }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          styles.envelopesScrollContent,
          isLoadingList && styles.envelopesScrollContentLoading,
        ]}
      >
        <ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={snapInterval}
          snapToAlignment="start"
          disableIntervalMomentum
          onMomentumScrollEnd={handleCarouselMomentumEnd}
          onContentSizeChange={handleCarouselContentSizeChange}
          style={styles.carouselScroll}
          contentContainerStyle={[
            styles.carouselContainer,
            { paddingHorizontal: sidePadding },
          ]}
        >
          {envelopes.map((env, idx) => (
            <TouchableOpacity
              key={env.id}
              activeOpacity={0.9}
              onPress={() => handleSelectEnvelope(idx)}
              style={{
                width: cardWidth,
                marginRight: idx < envelopes.length - 1 ? CARD_GAP : 0,
              }}
            >
              <RealEnvelopeCard
                envelope={env}
                activeCard={idx === currentIndex}
                fullWidth
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          {(['both', 'Debit', 'Credit'] as const).map((filterVal) => {
            const active = typeFilter === filterVal;
            const label =
              filterVal === 'both'
                ? t('table_toolbar.all')
                : filterVal === 'Debit'
                ? t('table_toolbar.debit')
                : t('table_toolbar.credit');
            return (
              <TouchableOpacity
                key={filterVal}
                onPress={() => setTypeFilter(filterVal)}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: active
                      ? activeEnvelope?.color || colors.primary.main
                      : colors.background.paper,
                    borderColor: active
                      ? activeEnvelope?.color || colors.primary.main
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? '#FFF' : colors.text.secondary,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.listCard,
            isLoadingList && styles.listCardFullHeight,
            {
              backgroundColor: colors.background.paper,
              borderColor: colors.border,
              borderTopColor: activeEnvelope?.color || colors.primary.main,
              borderTopWidth: 3,
            },
          ]}
        >
          {isLoadingList ? (
            <TransactionsListSkeleton />
          ) : groupedTransactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {t('transaction.empty')}
            </Text>
          ) : (
            groupedTransactions.map(([dateKey, group]) => (
              <View key={dateKey} style={{ marginBottom: 10 }}>
                <View style={styles.dateHeaderRow}>
                  <View
                    style={[
                      styles.dateHeaderLine,
                      { backgroundColor: colors.divider },
                    ]}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.text.disabled,
                    }}
                  >
                    {group.label}
                  </Text>
                  <View
                    style={[
                      styles.dateHeaderLine,
                      { backgroundColor: colors.divider },
                    ]}
                  />
                </View>

                {group.items.map((tx, idx) => {
                  const isDebit = tx.type === 'Debit';
                  const isCompleted =
                    tx.status === 'transaction.status.completed';
                  const isReallocation =
                    tx.paymentMethod ===
                    'envelope.transaction.payment_method.Reallocation';

                  return (
                    <ItemRow
                      key={tx.id}
                      hideDivider={idx === group.items.length - 1}
                      avatarBg={
                        isDebit ? colors.error.lighter : colors.success.lighter
                      }
                      avatarIcon={isDebit ? 'arrow-upward' : 'arrow-downward'}
                      avatarIconColor={
                        isDebit ? colors.error.main : colors.success.main
                      }
                      title={getTranslatedDescription(
                        tx.description,
                        tx.isTranslatable
                      )}
                      subtitle={
                        <>
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.text.secondary,
                            }}
                          >
                            {tx.creditCardName ?? t(tx.paymentMethod)}
                          </Text>
                          <TouchableOpacity
                            disabled={isReallocation}
                            onPress={() =>
                              updateStatusMutation.mutate({
                                id: tx.id,
                                status: isCompleted
                                  ? 'transaction.status.pending'
                                  : 'transaction.status.completed',
                              })
                            }
                            style={[
                              styles.statusChip,
                              {
                                borderColor: isCompleted
                                  ? colors.success.main
                                  : colors.warning.main,
                                backgroundColor: isCompleted
                                  ? colors.success.lighter
                                  : 'transparent',
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: isCompleted
                                  ? colors.success.dark
                                  : colors.warning.main,
                              }}
                            >
                              {t(tx.status)}
                            </Text>
                          </TouchableOpacity>
                        </>
                      }
                      amount={
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: isDebit
                              ? colors.error.main
                              : colors.success.main,
                          }}
                        >
                          {isDebit ? '−' : '+'} {fCurrency(tx.amount)}
                        </Text>
                      }
                      onPress={() => setEditingTx(tx)}
                    />
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.fabContainer}>
        {fabExpanded && (
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={[
                styles.fabSubBtn,
                {
                  backgroundColor: colors.background.paper,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                setFabExpanded(false);
                navigation.navigate('Reallocation', {
                  initialIndex: currentIndex,
                });
              }}
            >
              <MaterialIcons
                name="swap-vert"
                size={20}
                color={colors.primary.main}
              />
              <Text
                style={{
                  color: colors.text.primary,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                {t('common.reallocate')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fabSubBtn,
                {
                  backgroundColor: colors.background.paper,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                setFabExpanded(false);
                setEditingTx(null);
                setAddTxOpen(true);
              }}
            >
              <MaterialIcons
                name="add"
                size={20}
                color={colors.primary.main}
              />
              <Text
                style={{
                  color: colors.text.primary,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                {t('common.add')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.mainFab, { backgroundColor: colors.primary.main }]}
          onPress={() => setFabExpanded(!fabExpanded)}
        >
          <MaterialIcons
            name={fabExpanded ? 'close' : 'add'}
            size={26}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <TransactionFormModal
        visible={addTxOpen || !!editingTx}
        onClose={() => {
          setAddTxOpen(false);
          setEditingTx(null);
        }}
        envelopeId={activeEnvelopeId}
        envelopeBalance={activeEnvelope?.amount}
        data={editingTx}
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
  envelopesScrollContent: {
    flexGrow: 1,
  },
  envelopesScrollContentLoading: {
    paddingBottom: 16,
  },
  carouselScroll: {
    flexGrow: 0,
    marginHorizontal: -16,
    marginBottom: 14,
  },
  carouselContainer: {
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  listCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listCardFullHeight: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 30,
    fontSize: 14,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  fabMenu: {
    gap: 10,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  fabSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 4,
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
