import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CurrencyInput } from '../CurrencyInput';

describe('CurrencyInput (Molecule)', () => {
  it('formats numeric value as currency and emits decimal string on digit input', () => {
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <CurrencyInput
        testID="amount-input"
        label="Valor"
        value="1250.5"
        onChange={onChange}
        error
        helperText="Valor inválido"
      />
    );

    expect(getByText('Valor')).toBeTruthy();
    expect(getByText('R$')).toBeTruthy();
    expect(getByText('Valor inválido')).toBeTruthy();

    const input = getByTestId('amount-input');
    expect(input.props.value).toBe('1.250,50');

    fireEvent.changeText(input, '4590');
    expect(onChange).toHaveBeenCalledWith('45.90');

    fireEvent.changeText(input, '');
    expect(onChange).toHaveBeenCalledWith('');
  });
});
