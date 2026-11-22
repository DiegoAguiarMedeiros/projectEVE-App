import React from 'react';
import { Keyboard, StyleSheet, Text } from 'react-native';
import TestRenderer from 'react-test-renderer';
import { render } from '@testing-library/react-native';
import { KeyboardAvoidingContainer } from '../KeyboardAvoidingContainer';

describe('KeyboardAvoidingContainer (Atom)', () => {
  afterEach(() => {
    (Keyboard as any).__clear();
  });

  it('applies bottom padding when the keyboard shows and resets to 0 when it hides', () => {
    const { getByTestId, getByText } = render(
      <KeyboardAvoidingContainer testID="kb-container">
        {({ isKeyboardVisible, keyboardHeight }) => (
          <Text>
            {isKeyboardVisible ? `open:${keyboardHeight}` : 'closed'}
          </Text>
        )}
      </KeyboardAvoidingContainer>
    );

    expect(getByText('closed')).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId('kb-container').props.style).paddingBottom).toBeUndefined();

    TestRenderer.act(() => {
      (Keyboard as any).__emit('keyboardDidShow', {
        endCoordinates: { height: 320, screenY: 524, width: 390, screenX: 0 },
      });
    });

    expect(getByText('open:320')).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId('kb-container').props.style).paddingBottom).toBe(320);

    TestRenderer.act(() => {
      (Keyboard as any).__emit('keyboardDidHide', {
        endCoordinates: { height: 0, screenY: 844, width: 390, screenX: 0 },
      });
    });

    expect(getByText('closed')).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId('kb-container').props.style).paddingBottom).toBeUndefined();
  });
});
