import React from 'react';
import { ScrollView } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import { useAppTheme } from 'src/theme';
import { hexWithAlpha } from 'src/utils/format';

export interface EvolutionLineChartProps {
  categories: string[];
  primaryData: number[];
  secondaryData?: number[];
  primaryColor: string;
  secondaryColor?: string;
  currentCategory?: string;
}

export const EvolutionLineChart: React.FC<EvolutionLineChartProps> = ({
  categories,
  primaryData,
  secondaryData,
  primaryColor,
  secondaryColor,
  currentCategory,
}) => {
  const { colors } = useAppTheme();
  const allVals = [...primaryData, ...(secondaryData || [])];
  const maxVal = Math.max(...allVals, 1);

  const chartHeight = 200;
  const stepX = 52;
  const chartWidth = Math.max(categories.length * stepX + 40, 320);

  const getPoints = (data: number[]) =>
    data
      .map((val, idx) => {
        const x = 24 + idx * stepX;
        const y = chartHeight - (Math.max(0, val) / maxVal) * (chartHeight - 28);
        return `${x},${y}`;
      })
      .join(' ');

  const primaryPoints = getPoints(primaryData);
  const firstX = 24;
  const lastX = 24 + Math.max(0, primaryData.length - 1) * stepX;
  const areaPoints = `${firstX},${chartHeight} ${primaryPoints} ${lastX},${chartHeight}`;

  const currentIdx = currentCategory ? categories.indexOf(currentCategory) : -1;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={chartWidth} height={chartHeight + 34}>
        <Line
          x1={14}
          y1={chartHeight}
          x2={chartWidth - 14}
          y2={chartHeight}
          stroke={colors.divider}
          strokeWidth={1}
        />

        {primaryData.length > 1 && (
          <>
            <Polygon
              points={areaPoints}
              fill={hexWithAlpha(primaryColor, 0.2)}
            />
            <Polyline
              points={primaryPoints}
              fill="none"
              stroke={primaryColor}
              strokeWidth={3}
            />
          </>
        )}

        {secondaryData && secondaryData.length > 1 && secondaryColor && (
          <Polyline
            points={getPoints(secondaryData)}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}

        {currentIdx >= 0 && (
          <Line
            x1={24 + currentIdx * stepX}
            y1={10}
            x2={24 + currentIdx * stepX}
            y2={chartHeight}
            stroke={colors.info.main}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
        )}

        {primaryData.map((val, idx) => {
          const x = 24 + idx * stepX;
          const y =
            chartHeight - (Math.max(0, val) / maxVal) * (chartHeight - 28);
          return (
            <React.Fragment key={idx}>
              <Circle cx={x} cy={y} r={4} fill={primaryColor} />
              <SvgText
                x={x}
                y={chartHeight + 18}
                fontSize="10"
                fill={colors.text.secondary}
                textAnchor="middle"
              >
                {categories[idx]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </ScrollView>
  );
};
