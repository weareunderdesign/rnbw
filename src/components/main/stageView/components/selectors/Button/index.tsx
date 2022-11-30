import React from 'react';

import {
  useNode,
  UserComponent,
} from '@craftjs/core';

import { Text } from '../Text';
import { ButtonSettings } from './ButtonSettings';

export const Button: UserComponent<any> = (props: any) => {
  const {
    connectors: { connect, drag },
  } = useNode((node) => ({
    selected: node.events.selected,
  }));
  return (
    <button
      ref={ref => connect(drag(ref as HTMLElement))}
      style={props.style}
    >
      <Text text={props.children}></Text>
    </button >
  );
};

Button.craft = {
  displayName: 'Button',
  related: {
    settings: ButtonSettings,
  },
};
