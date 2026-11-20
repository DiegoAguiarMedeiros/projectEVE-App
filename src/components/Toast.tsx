import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { palette } from 'src/theme';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [opacity] = useState(new Animated.Value(0));

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      setToast({ message, variant });
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast(null);
      });
    },
    [opacity]
  );

  const getBgColor = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return palette.success.main;
      case 'error':
        return palette.error.main;
      case 'warning':
        return palette.warning.main;
      default:
        return palette.primary.main;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            {
              opacity,
              backgroundColor: getBgColor(toast.variant),
            },
          ]}
        >
          <Text
            style={[
              styles.toastText,
              toast.variant === 'warning' && { color: palette.grey[800] },
            ]}
          >
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 84,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});
