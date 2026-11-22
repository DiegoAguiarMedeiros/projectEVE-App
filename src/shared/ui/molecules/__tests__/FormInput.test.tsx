import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FormInput } from '../FormInput';

describe('FormInput (Molecule)', () => {
  it('renders label, forwards text changes, and displays error message', () => {
    const onChangeText = jest.fn();
    const { getByTestId, getByText } = render(
      <FormInput
        testID="desc-input"
        label="Descrição"
        value="Aluguel"
        error="Campo obrigatório"
        onChangeText={onChangeText}
      />
    );

    expect(getByText('Descrição')).toBeTruthy();
    expect(getByText('Campo obrigatório')).toBeTruthy();
    expect(getByTestId('desc-input-error')).toBeTruthy();

    fireEvent.changeText(getByTestId('desc-input'), 'Supermercado');
    expect(onChangeText).toHaveBeenCalledWith('Supermercado');
  });
});
