import React from 'react';
import { render } from '@testing-library/react-native';
import { RealEnvelopeCard } from '../RealEnvelopeCard';

describe('RealEnvelopeCard (Feature Molecule)', () => {
  it('renders envelope name, formatted balance, and clamped usage percentage', () => {
    const { getByTestId, getByText } = render(
      <RealEnvelopeCard
        testID="env-card"
        activeCard
        fullWidth
        envelope={{
          id: 'env-1',
          name: 'Transporte',
          color: '#FF5630',
          percentage: 20,
          amount: 900,
          used: 42.5,
        }}
      />
    );

    expect(getByTestId('env-card')).toBeTruthy();
    expect(getByText('Transporte')).toBeTruthy();
    expect(getByText('42.5%')).toBeTruthy();
  });
});
