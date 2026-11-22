import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AppButton } from '../AppButton';

describe('AppButton (Atom)', () => {
  it('renders title and triggers onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(
      <AppButton testID="save-btn" title="Salvar" onPress={onPress} />
    );

    expect(getByText('Salvar')).toBeTruthy();
    fireEvent.press(getByTestId('save-btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disables button and prevents onPress when disabled or loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AppButton
        testID="loading-btn"
        title="Salvar"
        loading
        onPress={onPress}
      />
    );

    const btn = getByTestId('loading-btn');
    expect(btn.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
    fireEvent.press(btn);
    expect(onPress).not.toHaveBeenCalled();
  });
});
