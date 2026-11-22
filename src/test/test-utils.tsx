import React from 'react';
import TestRenderer, {
  ReactTestInstance,
  ReactTestRenderer,
} from 'react-test-renderer';

function getTextContent(instance: ReactTestInstance | string): string {
  if (typeof instance === 'string') return instance;
  return instance.children
    .map((child: ReactTestInstance | string) =>
      typeof child === 'string' ? child : getTextContent(child)
    )
    .join('');
}

export function render(initialElement: React.ReactElement) {
  let tr!: ReactTestRenderer;

  TestRenderer.act(() => {
    tr = TestRenderer.create(initialElement);
  });

  const queryByTestId = (testID: string): ReactTestInstance | null => {
    const matches = tr.root.findAll(
      (node: ReactTestInstance) =>
        typeof node.type === 'string' && node.props?.testID === testID
    );
    return matches[0] ?? null;
  };

  const getByTestId = (testID: string): ReactTestInstance => {
    const found = queryByTestId(testID);
    if (!found) {
      throw new Error(`Unable to find element with testID="${testID}"`);
    }
    return found;
  };

  const queryByText = (text: string): ReactTestInstance | null => {
    const matches = tr.root.findAll(
      (node: ReactTestInstance) =>
        node.type === 'Text' &&
        (getTextContent(node) === text || getTextContent(node).includes(text))
    );
    return matches[0] ?? null;
  };

  const getByText = (text: string): ReactTestInstance => {
    const found = queryByText(text);
    if (!found) {
      throw new Error(`Unable to find Text element containing "${text}"`);
    }
    return found;
  };

  const rerender = (nextElement: React.ReactElement) => {
    TestRenderer.act(() => {
      tr.update(nextElement);
    });
  };

  const unmount = () => {
    TestRenderer.act(() => {
      tr.unmount();
    });
  };

  return {
    getByTestId,
    queryByTestId,
    getByText,
    queryByText,
    rerender,
    unmount,
    toJSON: () => tr.toJSON(),
  };
}

export const fireEvent = {
  press: (instance: ReactTestInstance) => {
    if (instance.props?.disabled) return;
    if (typeof instance.props?.onPress === 'function') {
      TestRenderer.act(() => {
        instance.props.onPress();
      });
    }
  },
  changeText: (instance: ReactTestInstance, text: string) => {
    if (typeof instance.props?.onChangeText === 'function') {
      TestRenderer.act(() => {
        instance.props.onChangeText(text);
      });
    }
  },
};

export const renderComponent = render;
