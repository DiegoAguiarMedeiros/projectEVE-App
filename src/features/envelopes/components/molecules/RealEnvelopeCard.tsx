import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Envelopes } from 'src/types';
import { fNumberToCurrency, getContrastColor } from 'src/utils/format';

export interface RealEnvelopeCardProps {
  envelope: Envelopes;
  activeCard: boolean;
  fullWidth?: boolean;
  testID?: string;
}

export const RealEnvelopeCard: React.FC<RealEnvelopeCardProps> = ({
  envelope,
  activeCard,
  fullWidth,
  testID,
}) => {
  const { t } = useTranslation();
  const baseColor = envelope.color || '#1877F2';
  const textColor = getContrastColor(baseColor);
  const used = Math.min(Math.max(envelope?.used ?? 0, 0), 100);
  const cardHeight = fullWidth ? 132 : 140;
  const uid = (envelope.id || envelope.name || 'env').replace(
    /[^a-zA-Z0-9]/g,
    ''
  );

  return (
    <View
      testID={testID}
      style={[
        styles.outer,
        {
          height: cardHeight,
          opacity: activeCard ? 1 : 0.72,
          transform: [{ scale: activeCard ? 1.03 : 0.96 }],
        },
      ]}
    >
      <View
        style={[
          styles.card,
          activeCard ? styles.cardActiveShadow : styles.cardInactiveShadow,
          { height: cardHeight, backgroundColor: baseColor },
        ]}
      >
        {/* SVG Envelope Geometry */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 300 140"
            preserveAspectRatio="none"
          >
            <Defs>
              {/* Subtle vertical paper lighting on body */}
              <LinearGradient id={`bodyGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000000" stopOpacity="0.03" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0.10" />
              </LinearGradient>

              {/* Top flap gentle light gradient */}
              <LinearGradient id={`flapGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.20" />
                <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.05" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0.03" />
              </LinearGradient>
            </Defs>

            {/* Base envelope body */}
            <Rect x="0" y="0" width="300" height="140" fill={baseColor} />
            <Rect
              x="0"
              y="0"
              width="300"
              height="140"
              fill={`url(#bodyGrad-${uid})`}
            />

            {/* Soft diffused drop shadow under the top flap (3 feathered layers) */}
            <Path
              d="M 0,4 L 138,71 Q 150,77 162,71 L 300,4 L 300,0 L 0,0 Z"
              fill="rgba(0,0,0,0.03)"
            />
            <Path
              d="M 0,2 L 139,68 Q 150,74 161,68 L 300,2 L 300,0 L 0,0 Z"
              fill="rgba(0,0,0,0.05)"
            />
            <Path
              d="M 0,1 L 140,66 Q 150,71 160,66 L 300,1 L 300,0 L 0,0 Z"
              fill="rgba(0,0,0,0.08)"
            />

            {/* Top flap */}
            <Path
              d="M 0,0 L 300,0 L 160,64 Q 150,69 140,64 Z"
              fill={baseColor}
            />
            <Path
              d="M 0,0 L 300,0 L 160,64 Q 150,69 140,64 Z"
              fill={`url(#flapGrad-${uid})`}
            />

            {/* Crisp paper edge highlight along the top flap */}
            <Path
              d="M 0,0 L 140,64 Q 150,69 160,64 L 300,0"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1"
              fill="none"
            />
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
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  cardActiveShadow: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardInactiveShadow: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
