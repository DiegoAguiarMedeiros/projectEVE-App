import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import dayjs from 'dayjs';
import { useAppTheme } from 'src/theme';
import { useSelectedMonthYearStore } from 'src/store/useSelectedMonthYearStore';
import {
  useListEnvelopesWithAmount,
  useListTransactionsByEnvelope,
  useProcessedIncomes,
  useTotalProcessedIncomes,
  useTransferBalance,
  useUpdateStatusTransactions,
} from 'src/hooks/useApi';
import { RealEnvelopeCard } from 'src/components/RealEnvelopeCard';
import { ItemRow } from 'src/components/ItemRow';
import {
  ProcessedIncomeFormModal,
  TransactionFormModal,
} from 'src/components/FormModals';
import { CurrencyInput } from 'src/components/CurrencyInput';
import { AppButton, FloatingAddButton } from 'src/components/FormElements';
import { ProcessedIncomes, Transactions } from 'src/types';
import { fCurrency, fDate } from 'src/utils/format';

const CARD_GAP = 14;

const SKELETON_ROW_PATTERNS = [
  { titleWidth: '68%' as const, amountWidth: 72 },
  { titleWidth: '54%' as const, amountWidth: 64 },
  { titleWidth: '76%' as const, amountWidth: 78 },
  { titleWidth: '60%' as const, amountWidth: 68 },
  { titleWidth: '72%' as const, amountWidth: 70 },
];

const SKELETON_HEADER_HEIGHT = 24;
const SKELETON_ROW_HEIGHT = 63;

const TransactionsListSkeleton: React.FC = () => {
  const { colors, isDark } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const pulse = useRef(new Animated.Value(0.45)).current;
  const [rowCount, setRowCount] = useState(() =>
    Math.max(4, Math.floor((windowHeight - 360) / SKELETON_ROW_HEIGHT))
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const boneColor = isDark
    ? 'rgba(145, 158, 171, 0.22)'
    : 'rgba(145, 158, 171, 0.28)';

  return (
    <Animated.View
      style={[styles.skeletonContainer, { opacity: pulse }]}
      onLayout={(e) => {
        const availableHeight = e.nativeEvent.layout.height;
        const nextCount = Math.max(
          4,
          Math.floor((availableHeight - SKELETON_HEADER_HEIGHT) / SKELETON_ROW_HEIGHT)
        );
        if (nextCount !== rowCount) {
          setRowCount(nextCount);
        }
      }}
    >
      <View style={styles.dateHeaderRow}>
        <View style={[styles.dateHeaderLine, { backgroundColor: colors.divider }]} />
        <View style={[styles.skeletonDatePill, { backgroundColor: boneColor }]} />
        <View style={[styles.dateHeaderLine, { backgroundColor: colors.divider }]} />
      </View>

      {Array.from({ length: rowCount }).map((_, idx) => {
        const row = SKELETON_ROW_PATTERNS[idx % SKELETON_ROW_PATTERNS.length];
        return (
          <View key={idx}>
            <View style={styles.skeletonRow}>
              <View style={[styles.skeletonAvatar, { backgroundColor: boneColor }]} />
              <View style={styles.skeletonMiddle}>
                <View
                  style={[
                    styles.skeletonTitle,
                    { width: row.titleWidth, backgroundColor: boneColor },
                  ]}
                />
                <View style={styles.skeletonSubtitleRow}>
                  <View
                    style={[styles.skeletonSubtitle, { backgroundColor: boneColor }]}
                  />
                  <View style={[styles.skeletonChip, { backgroundColor: boneColor }]} />
                </View>
              </View>
              <View
                style={[
                  styles.skeletonAmount,
                  { width: row.amountWidth, backgroundColor: boneColor },
                ]}
              />
            </View>
            {idx < rowCount - 1 && (
              <View
                style={[styles.skeletonDivider, { backgroundColor: colors.divider }]}
              />
            )}
          </View>
        );
      })}
    </Animated.View>
  );
};

// ─── 1. Envelopes & Transactions Screen ───────────────────────────────────────

export const EnvelopesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
  const [typeFilter, setTypeFilter] = useState<'both' | 'Debit' | 'Credit'>('both');

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
      const safeIndex = Math.min(Math.max(currentIndex, 0), envelopes.length - 1);
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
  } = useListTransactionsByEnvelope(
    activeEnvelopeId,
    year,
    month,
    {
      type: typeFilter === 'both' ? undefined : typeFilter,
    }
  );

  const updateStatusMutation = useUpdateStatusTransactions();

  const getTranslatedDescription = (desc: string, isTranslatable?: boolean) => {
    if (!isTranslatable) return desc;
    const [key, arg] = desc.split('|');
    if (arg) return t(key, { name: arg });
    return t(key);
  };

  // Group transactions by date ("Hoje", "Ontem", "DD/MM/YYYY")
  const groupedTransactions = useMemo(() => {
    const items = transactionsData?.data ?? [];
    const groups = new Map<string, { label: string; items: Transactions[] }>();

    for (const tx of items) {
      const key = tx.date ? dayjs(tx.date).format('YYYY-MM-DD') : 'no-date';
      if (!groups.has(key)) {
        const d = dayjs(key);
        const today = dayjs().startOf('day');
        const yesterday = dayjs().subtract(1, 'day').startOf('day');
        let label = fDate(key);
        if (d.isValid()) {
          if (d.isSame(today, 'day')) label = t('common.today');
          else if (d.isSame(yesterday, 'day')) label = t('common.yesterday');
        }
        groups.set(key, { label, items: [] });
      }
      groups.get(key)!.items.push(tx);
    }

    return Array.from(groups.entries());
  }, [transactionsData, t]);

  const isLoadingList =
    isLoadingEnvelopes ||
    isLoadingTransactions ||
    (isFetchingTransactions && groupedTransactions.length === 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          styles.envelopesScrollContent,
          isLoadingList && styles.envelopesScrollContentLoading,
        ]}
      >
        {/* Horizontal Envelopes Carousel */}
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

        {/* Filter Bar (All / Expense / Income) */}
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

        {/* Transactions List Card */}
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
                  const isCompleted = tx.status === 'transaction.status.completed';
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
                            style={{ fontSize: 12, color: colors.text.secondary }}
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

      {/* SpeedDial / Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {fabExpanded && (
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={[
                styles.fabSubBtn,
                { backgroundColor: colors.background.paper, borderColor: colors.border },
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
                { backgroundColor: colors.background.paper, borderColor: colors.border },
              ]}
              onPress={() => {
                setFabExpanded(false);
                setEditingTx(null);
                setAddTxOpen(true);
              }}
            >
              <MaterialIcons name="add" size={20} color={colors.primary.main} />
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
        data={editingTx}
      />
    </View>
  );
};

// ─── 2. Reallocation / Balance Transfer Screen ────────────────────────────────

export const ReallocationScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { month, year, lastSlideIndex } = useSelectedMonthYearStore();
  const { data: envelopes = [] } = useListEnvelopesWithAmount(year, month);
  const transferMutation = useTransferBalance();

  const [sourceIndex, setSourceIndex] = useState(
    route?.params?.initialIndex ?? lastSlideIndex ?? 0
  );
  const [destIndex, setDestIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sourceEnvelope = envelopes[sourceIndex] || envelopes[0];
  const destinationEnvelopes = envelopes.filter(
    (e) => e.id !== sourceEnvelope?.id
  );
  const destinationEnvelope =
    destinationEnvelopes[destIndex] || destinationEnvelopes[0];

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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.default }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <View
        style={[
          styles.reallocCard,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
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

        {/* Source Envelope Selector */}
        <Text style={[styles.reallocLabel, { color: colors.text.secondary }]}>
          {t('envelope.transfer.from')}
        </Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity
            onPress={() =>
              setSourceIndex((prev: number) =>
                prev === 0 ? envelopes.length - 1 : prev - 1
              )
            }
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
            onPress={() =>
              setSourceIndex((prev: number) =>
                prev === envelopes.length - 1 ? 0 : prev + 1
              )
            }
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

        {/* Destination Envelope Selector */}
        <Text style={[styles.reallocLabel, { color: colors.text.secondary }]}>
          {t('envelope.transfer.to')}
        </Text>
        <View style={[styles.selectorRow, { marginBottom: 20 }]}>
          <TouchableOpacity
            onPress={() =>
              setDestIndex((prev) =>
                prev === 0 ? destinationEnvelopes.length - 1 : prev - 1
              )
            }
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
            onPress={() =>
              setDestIndex((prev) =>
                prev === destinationEnvelopes.length - 1 ? 0 : prev + 1
              )
            }
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
  );
};

// ─── 3. Processed Incomes Screen ("Minha Renda") ──────────────────────────────

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
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Total Header Banner */}
        <View
          style={[
            styles.totalBanner,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
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
            { backgroundColor: colors.background.paper, borderColor: colors.border },
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
                    <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                      {fDate(`${item.year}-${item.month}-${item.day}`)}
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
  listCardFullHeight: {
    flex: 1,
  },
  skeletonContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  skeletonDatePill: {
    width: 64,
    height: 12,
    borderRadius: 6,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 12,
  },
  skeletonAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  skeletonMiddle: {
    flex: 1,
    gap: 6,
  },
  skeletonTitle: {
    height: 13,
    borderRadius: 6,
  },
  skeletonSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skeletonSubtitle: {
    width: 72,
    height: 10,
    borderRadius: 5,
  },
  skeletonChip: {
    width: 54,
    height: 16,
    borderRadius: 6,
  },
  skeletonAmount: {
    height: 14,
    borderRadius: 6,
  },
  skeletonDivider: {
    height: 1,
    width: '100%',
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
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
});
