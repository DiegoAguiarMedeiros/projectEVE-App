import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BaseFormModal } from '../BaseFormModal';

describe('BaseFormModal (Organism)', () => {
  it('renders delete button only when onDelete is provided and triggers callbacks', () => {
    const onSubmit = jest.fn();
    const onDelete = jest.fn();
    const onClose = jest.fn();

    const { getByTestId, queryByTestId, rerender } = render(
      <BaseFormModal
        visible
        title="Editar Transação"
        submitLabel="Salvar"
        onClose={onClose}
        onSubmit={onSubmit}
      >
        <Text>Conteúdo</Text>
      </BaseFormModal>
    );

    expect(queryByTestId('modal-delete-button')).toBeNull();

    rerender(
      <BaseFormModal
        visible
        title="Editar Transação"
        submitLabel="Salvar"
        onClose={onClose}
        onSubmit={onSubmit}
        onDelete={onDelete}
      >
        <Text>Conteúdo</Text>
      </BaseFormModal>
    );

    fireEvent.press(getByTestId('modal-delete-button'));
    expect(onDelete).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('modal-submit-button'));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('modal-cancel-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
