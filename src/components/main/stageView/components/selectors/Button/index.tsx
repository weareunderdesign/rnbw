import { UserComponent, useNode, UserComponentConfig } from '@craftjs/core';
import cx from 'classnames';
import React from 'react';
import { ButtonSettings } from './ButtonSettings';

import { Text } from '../Text';

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
