declare module 'react-test-renderer' {
  import React from 'react';

  export interface ReactTestInstance {
    instance: any;
    type: any;
    props: { [propName: string]: any };
    parent: null | ReactTestInstance;
    children: Array<ReactTestInstance | string>;
    findAll(
      predicate: (node: ReactTestInstance) => boolean,
      options?: { deep?: boolean }
    ): ReactTestInstance[];
  }

  export interface ReactTestRenderer {
    root: ReactTestInstance;
    toJSON(): any;
    update(nextElement: React.ReactElement): void;
    unmount(): void;
  }

  const TestRenderer: {
    create(nextElement: React.ReactElement): ReactTestRenderer;
    act(callback: () => void | Promise<void>): any;
  };

  export default TestRenderer;
}
