import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { EnvelopeLimitFormModal } from '../EnvelopeLimitFormModal';
import * as envelopesApi from 'src/features/envelopes/api/useEnvelopesApi';
import { useIncomeStore } from 'src/store/useIncomeStore';
import { Envelopes } from 'src/types';

const mockMutateAsync = jest.fn();

describe('EnvelopeLimitFormModal (Organism)', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue(undefined);
    jest.spyOn(envelopesApi, 'useUpdateEnvelopes').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
    useIncomeStore.setState({ income: 3842.5 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const envelope: Envelopes = {
    id: 'env-1',
    name: 'leisure',
    color: '#1877F2',
    percentage: 10,
  };

  const allEnvelopes: Envelopes[] = [
    envelope,
    { id: 'env-2', name: 'fixed', color: '#22C55E', percentage: 50 },
  ];

  it('preserves full percentage precision when typing a currency limit so R$200 saves as R$200.00', async () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <EnvelopeLimitFormModal
        visible
        onClose={onClose}
        data={envelope}
        allEnvelopes={allEnvelopes}
      />
    );

    const input = getByTestId('envelope-value-input');
    fireEvent.changeText(input, '20000');

    fireEvent.press(getByTestId('modal-submit-button'));
    await Promise.resolve();

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    const payload = mockMutateAsync.mock.calls[0][0];
    const savedAmount = (payload.percentage / 100) * 3842.5;
    expect(savedAmount).toBeCloseTo(200, 10);
  });

  it('resets percentage to 0 when the currency input is cleared', async () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <EnvelopeLimitFormModal
        visible
        onClose={onClose}
        data={envelope}
        allEnvelopes={allEnvelopes}
      />
    );

    const input = getByTestId('envelope-value-input');
    fireEvent.changeText(input, '');

    fireEvent.press(getByTestId('modal-submit-button'));
    await Promise.resolve();

    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: 'env-1',
      name: 'leisure',
      color: '#1877F2',
      percentage: 0,
    });
  });
});
