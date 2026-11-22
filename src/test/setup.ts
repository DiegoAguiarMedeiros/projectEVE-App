import React from 'react';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('outdated JSX transform')
  ) {
    return;
  }
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('react-test-renderer is deprecated')
  ) {
    return;
  }
  originalError(...args);
};

const createHostComponent = (name: string) => {
  const Comp = React.forwardRef((props: any, ref: any) =>
    React.createElement(name, { ...props, ref }, props.children)
  );
  Comp.displayName = name;
  return Comp;
};

jest.mock('react-native', () => {
  const StyleSheet = {
    create: <T extends Record<string, any>>(styles: T): T => styles,
    flatten: (style: any): any => {
      if (!style) return {};
      if (Array.isArray(style)) {
        return style.reduce(
          (acc, item) => ({ ...acc, ...StyleSheet.flatten(item) }),
          {}
        );
      }
      return typeof style === 'object' ? style : {};
    },
    absoluteFill: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    absoluteFillObject: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  };

  const keyboardListeners = new Map<string, Set<(e?: any) => void>>();
  const Keyboard = {
    addListener: (event: string, cb: (e?: any) => void) => {
      if (!keyboardListeners.has(event)) {
        keyboardListeners.set(event, new Set());
      }
      keyboardListeners.get(event)!.add(cb);
      return {
        remove: () => {
          keyboardListeners.get(event)?.delete(cb);
        },
      };
    },
    dismiss: jest.fn(),
    __emit: (event: string, payload?: any) => {
      keyboardListeners.get(event)?.forEach((cb) => cb(payload));
    },
    __clear: () => {
      keyboardListeners.clear();
    },
  };

  return {
    Platform: {
      OS: 'android',
      select: (obj: Record<string, any>) => obj.android ?? obj.default,
    },
    StyleSheet,
    Keyboard,
    KeyboardAvoidingView: createHostComponent('KeyboardAvoidingView'),
    View: createHostComponent('View'),
    Text: createHostComponent('Text'),
    TextInput: createHostComponent('TextInput'),
    TouchableOpacity: createHostComponent('TouchableOpacity'),
    ScrollView: createHostComponent('ScrollView'),
    ActivityIndicator: createHostComponent('ActivityIndicator'),
    Modal: ({ visible = true, children, ...rest }: any) =>
      visible
        ? React.createElement('Modal', { visible, ...rest }, children)
        : null,
    Switch: createHostComponent('Switch'),
    Animated: {
      View: createHostComponent('Animated.View'),
      Value: class {
        value: number;
        constructor(v: number) {
          this.value = v;
        }
      },
      timing: () => ({ start: () => {}, stop: () => {} }),
      sequence: () => ({ start: () => {}, stop: () => {} }),
      loop: () => ({ start: () => {}, stop: () => {} }),
    },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  };
});

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: createHostComponent('MaterialIcons'),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  },
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  removeItem: jest.fn(async () => {}),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 48, left: 0, right: 0 }),
  SafeAreaProvider: createHostComponent('SafeAreaProvider'),
  SafeAreaView: createHostComponent('SafeAreaView'),
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: createHostComponent('Svg'),
  Svg: createHostComponent('Svg'),
  Defs: createHostComponent('Defs'),
  LinearGradient: createHostComponent('LinearGradient'),
  Stop: createHostComponent('Stop'),
  Path: createHostComponent('Path'),
  Rect: createHostComponent('Rect'),
  Circle: createHostComponent('Circle'),
  Line: createHostComponent('Line'),
  Polygon: createHostComponent('Polygon'),
  Polyline: createHostComponent('Polyline'),
  Text: createHostComponent('SvgText'),
}));

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: createHostComponent('DateTimePicker'),
}));

jest.mock('@react-native-community/slider', () => ({
  __esModule: true,
  default: createHostComponent('Slider'),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
    i18n: { language: 'pt-BR', changeLanguage: jest.fn(async () => {}) },
  }),
}));

jest.mock('src/theme', () => ({
  useAppTheme: () => ({
    mode: 'light',
    isDark: false,
    toggleTheme: jest.fn(),
    setThemeMode: jest.fn(),
    colors: {
      primary: {
        lighter: '#D0ECFE',
        light: '#73BAFB',
        main: '#1877F2',
        dark: '#0C44AE',
        darker: '#042174',
        contrastText: '#FFFFFF',
      },
      secondary: {
        lighter: '#EFD6FF',
        light: '#C684FF',
        main: '#8E33FF',
        dark: '#5119B7',
        darker: '#27097A',
        contrastText: '#FFFFFF',
      },
      info: {
        lighter: '#CAFDF5',
        light: '#61F3F3',
        main: '#00B8D9',
        dark: '#006C9C',
        darker: '#003768',
        contrastText: '#FFFFFF',
      },
      success: {
        lighter: '#D3FCD2',
        light: '#77ED8B',
        main: '#22C55E',
        dark: '#118D57',
        darker: '#065E49',
        contrastText: '#ffffff',
      },
      warning: {
        lighter: '#FFF5CC',
        light: '#FFD666',
        main: '#FFAB00',
        dark: '#B76E00',
        darker: '#7A4100',
        contrastText: '#1C252E',
      },
      error: {
        lighter: '#FFE9D5',
        light: '#FFAC82',
        main: '#FF5630',
        dark: '#B71D18',
        darker: '#7A0916',
        contrastText: '#FFFFFF',
      },
      background: {
        default: '#EBEBEB',
        paper: '#F5F5F5',
        neutral: '#F4F6F8',
      },
      text: {
        primary: '#1C252E',
        secondary: '#637381',
        disabled: '#919EAB',
      },
      divider: 'rgba(145, 158, 171, 0.2)',
      border: 'rgba(145, 158, 171, 0.16)',
    },
  }),
}));
