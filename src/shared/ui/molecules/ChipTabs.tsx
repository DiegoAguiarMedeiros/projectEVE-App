import React, { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from 'src/theme';

export interface ChipTabItem {
  label: string;
  index: number;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export interface ChipTabsProps {
  tabs: ChipTabItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  testIDPrefix?: string;
}

export const ChipTabs: React.FC<ChipTabsProps> = ({
  tabs,
  activeIndex,
  onChange,
  testIDPrefix = 'chip-tab',
}) => {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});

  useEffect(() => {
    const layout = tabLayouts.current[activeIndex];
    if (layout) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, layout.x - 16),
        animated: true,
      });
    }
  }, [activeIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipTabsScroll}
      contentContainerStyle={styles.chipTabsContainer}
    >
      {tabs.map((tab) => {
        const active = tab.index === activeIndex;
        return (
          <TouchableOpacity
            key={tab.index}
            testID={`${testIDPrefix}-${tab.index}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            activeOpacity={0.75}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              tabLayouts.current[tab.index] = { x, width };
            }}
            onPress={() => onChange(tab.index)}
            style={[
              styles.chipTab,
              {
                backgroundColor: active
                  ? colors.primary.main
                  : colors.background.paper,
                borderColor: active ? colors.primary.main : colors.border,
              },
            ]}
          >
            {tab.icon && (
              <MaterialIcons
                name={tab.icon}
                size={16}
                color={active ? '#FFF' : colors.text.secondary}
              />
            )}
            <Text
              numberOfLines={1}
              style={{
                color: active ? '#FFF' : colors.text.secondary,
                fontWeight: active ? '700' : '600',
                fontSize: 13,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  chipTabsScroll: {
    flexGrow: 0,
    marginHorizontal: -16,
    marginBottom: 8,
  },
  chipTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  chipTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
});
