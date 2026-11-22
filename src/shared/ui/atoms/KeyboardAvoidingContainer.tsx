import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

export interface KeyboardAvoidanceState {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

export interface KeyboardAvoidingContainerProps
  extends Omit<ViewProps, 'children'> {
  children:
    | React.ReactNode
    | ((state: KeyboardAvoidanceState) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
  enabled?: boolean;
}

export const KeyboardAvoidingContainer: React.FC<
  KeyboardAvoidingContainerProps
> = ({ children, style, enabled = true, onLayout, ...rest }) => {
  const viewRef = useRef<View>(null);
  const keyboardEventRef = useRef<KeyboardEvent | null>(null);
  const [bottomPadding, setBottomPadding] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const computeOffset = useCallback(() => {
    const event = keyboardEventRef.current;
    if (!enabled || !event) {
      setBottomPadding(0);
      return;
    }

    const { height: kbHeight, screenY: kbScreenY } = event.endCoordinates;
    if (kbHeight <= 0) {
      setBottomPadding(0);
      return;
    }

    const node = viewRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((_x, y, _width, height) => {
        if (height > 0 && kbScreenY > 0) {
          const overlap = Math.max(0, y + height - kbScreenY);
          setBottomPadding(overlap);
        } else {
          setBottomPadding(kbHeight);
        }
      });
    } else {
      setBottomPadding(kbHeight);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      keyboardEventRef.current = null;
      setIsKeyboardVisible(false);
      setBottomPadding(0);
      return;
    }

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardEventRef.current = e;
      setIsKeyboardVisible(true);
      computeOffset();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardEventRef.current = null;
      setIsKeyboardVisible(false);
      setBottomPadding(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [enabled, computeOffset]);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (keyboardEventRef.current) {
        computeOffset();
      }
      onLayout?.(e);
    },
    [computeOffset, onLayout]
  );

  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      style={[
        style,
        bottomPadding > 0 ? { paddingBottom: bottomPadding } : null,
      ]}
      {...rest}
    >
      {typeof children === 'function'
        ? children({ keyboardHeight: bottomPadding, isKeyboardVisible })
        : children}
    </View>
  );
};
