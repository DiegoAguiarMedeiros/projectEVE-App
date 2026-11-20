import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Envelopes } from 'src/types';
import { fNumberToCurrency, getContrastColor, hexWithAlpha } from 'src/utils/format';

interface RealEnvelopeCardProps {
  envelope: Envelopes;
  activeCard: boolean;
  fullWidth?: boolean;
}

export const RealEnvelopeCard: React.FC<RealEnvelopeCardProps> = ({
  envelope,
  activeCard,
  fullWidth,
}) => {
  const { t } = useTranslation();
  const baseColor = envelope.color || '#1877F2';
  const textColor = getContrastColor(baseColor);
  const used = Math.min(Math.max(envelope?.used ?? 0, 0), 100);
  const cardHeight = fullWidth ? 132 : 140;

  return (
    <View
      style={[
        styles.outer,
        {
          height: cardHeight,
          opacity: activeCard ? 1 : 0.72,
          transform: [{ scale: activeCard ? 1.03 : 0.96 }],
        },
      ]}
    >
      <View style={[styles.card, { height: cardHeight }]}>
        {/* SVG Envelope Geometry */}
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox="0 0 300 140" preserveAspectRatio="none">
            {/* Dark base inside envelope */}
            <Rect x="0" y="0" width="300" height="140" rx="12" fill="rgba(0,0,0,0.45)" />
            {/* Main body */}
            <Rect x="0" y="0" width="300" height="140" rx="12" fill={hexWithAlpha(baseColor, 0.75)} />
            {/* Left fold */}
            <Polygon points="0,0 150,72 0,140" fill={hexWithAlpha(baseColor, 0.85)} />
            {/* Right fold */}
            <Polygon points="300,0 150,72 300,140" fill={hexWithAlpha(baseColor, 0.85)} />
            {/* Bottom pocket */}
            <Polygon points="0,140 150,68 300,140" fill={hexWithAlpha(baseColor, 0.95)} />
            {/* Top flap shadow */}
            <Polygon points="6,0 150,72 294,0" fill="rgba(0,0,0,0.22)" />
            {/* Top flap */}
            <Polygon points="6,0 150,66 294,0" fill={baseColor} />
          </Svg>
        </View>

        {/* Content Layer */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text
              numberOfLines={1}
              style={[styles.envelopeName, { color: textColor }]}
            >
              {t(envelope.name)}
            </Text>
            <Text style={[styles.amountText, { color: textColor }]}>
              {fNumberToCurrency(envelope.amount ?? 0)}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${used}%`,
                  backgroundColor: textColor,
                },
              ]}
            />
            <View style={styles.progressLabelOverlay}>
              <Text
                style={[
                  styles.progressText,
                  {
                    color: used > 52 ? baseColor : textColor,
                  },
                ]}
              >
                {Number(used.toFixed(1))}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 14,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  envelopeName: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
  },
  progressLabelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
