import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useAppTheme } from 'src/theme';

const SKELETON_ROW_PATTERNS = [
  { titleWidth: '68%' as const, amountWidth: 72 },
  { titleWidth: '54%' as const, amountWidth: 64 },
  { titleWidth: '76%' as const, amountWidth: 78 },
  { titleWidth: '60%' as const, amountWidth: 68 },
  { titleWidth: '72%' as const, amountWidth: 70 },
];

const SKELETON_HEADER_HEIGHT = 24;
const SKELETON_ROW_HEIGHT = 63;

export const TransactionsListSkeleton: React.FC = () => {
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
      testID="transactions-list-skeleton"
      style={[styles.skeletonContainer, { opacity: pulse }]}
      onLayout={(e) => {
        const availableHeight = e.nativeEvent.layout.height;
        const nextCount = Math.max(
          4,
          Math.floor(
            (availableHeight - SKELETON_HEADER_HEIGHT) / SKELETON_ROW_HEIGHT
          )
        );
        if (nextCount !== rowCount) {
          setRowCount(nextCount);
        }
      }}
    >
      <View style={styles.dateHeaderRow}>
        <View
          style={[styles.dateHeaderLine, { backgroundColor: colors.divider }]}
        />
        <View style={[styles.skeletonDatePill, { backgroundColor: boneColor }]} />
        <View
          style={[styles.dateHeaderLine, { backgroundColor: colors.divider }]}
        />
      </View>

      {Array.from({ length: rowCount }).map((_, idx) => {
        const row = SKELETON_ROW_PATTERNS[idx % SKELETON_ROW_PATTERNS.length];
        return (
          <View key={idx}>
            <View style={styles.skeletonRow}>
              <View
                style={[styles.skeletonAvatar, { backgroundColor: boneColor }]}
              />
              <View style={styles.skeletonMiddle}>
                <View
                  style={[
                    styles.skeletonTitle,
                    { width: row.titleWidth, backgroundColor: boneColor },
                  ]}
                />
                <View style={styles.skeletonSubtitleRow}>
                  <View
                    style={[
                      styles.skeletonSubtitle,
                      { backgroundColor: boneColor },
                    ]}
                  />
                  <View
                    style={[styles.skeletonChip, { backgroundColor: boneColor }]}
                  />
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
                style={[
                  styles.skeletonDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
            )}
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    overflow: 'hidden',
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
});
