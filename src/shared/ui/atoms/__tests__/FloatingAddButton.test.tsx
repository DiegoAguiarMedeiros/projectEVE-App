import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FloatingAddButton } from '../FloatingAddButton';

describe('FloatingAddButton (Atom)', () => {
  it('renders standardized round FAB and invokes onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<FloatingAddButton onPress={onPress} />);

    const fab = getByTestId('floating-add-button');
    expect(fab.props.accessibilityRole).toBe('button');
    fireEvent.press(fab);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
