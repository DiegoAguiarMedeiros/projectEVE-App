import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ItemRow } from '../ItemRow';

describe('ItemRow (Molecule)', () => {
  it('calls onPress directly without opening action sheet when onPress is provided', () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(
      <ItemRow
        testID="tx-row"
        avatarBg="#FFE9D5"
        avatarIcon="arrow-upward"
        avatarIconColor="#FF5630"
        title="Supermercado"
        amount={<Text>- R$ 150,00</Text>}
        onPress={onPress}
      />
    );

    expect(getByText('Supermercado')).toBeTruthy();
    expect(getByText('- R$ 150,00')).toBeTruthy();

    fireEvent.press(getByTestId('tx-row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('opens action sheet and executes menu action when menuActions are provided', () => {
    const onEvolution = jest.fn();
    const { getByTestId } = render(
      <ItemRow
        testID="goal-row"
        avatarBg="#D0ECFE"
        avatarIcon="savings"
        avatarIconColor="#1877F2"
        title="Reserva de Emergência"
        amount={<Text>R$ 10.000,00</Text>}
        menuActions={[
          {
            label: 'Ver evolução',
            iconName: 'show-chart',
            onPress: onEvolution,
          },
        ]}
      />
    );

    fireEvent.press(getByTestId('goal-row'));
    fireEvent.press(getByTestId('goal-row-action-0'));
    expect(onEvolution).toHaveBeenCalledTimes(1);
  });
});
