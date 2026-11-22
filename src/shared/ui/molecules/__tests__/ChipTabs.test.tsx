import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ChipTabs } from '../ChipTabs';

describe('ChipTabs (Molecule)', () => {
  it('renders horizontal tabs with selected state and triggers onChange', () => {
    const onChange = jest.fn();
    const tabs = [
      { label: 'Renda', index: 0, icon: 'attach-money' as const },
      { label: 'Envelopes', index: 1, icon: 'mail' as const },
      { label: 'Metas', index: 2, icon: 'savings' as const },
    ];

    const { getByTestId, getByText } = render(
      <ChipTabs tabs={tabs} activeIndex={1} onChange={onChange} />
    );

    expect(getByText('Renda')).toBeTruthy();
    expect(getByText('Envelopes')).toBeTruthy();
    expect(getByText('Metas')).toBeTruthy();

    expect(getByTestId('chip-tab-0').props.accessibilityState).toEqual({
      selected: false,
    });
    expect(getByTestId('chip-tab-1').props.accessibilityState).toEqual({
      selected: true,
    });

    fireEvent.press(getByTestId('chip-tab-2'));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
