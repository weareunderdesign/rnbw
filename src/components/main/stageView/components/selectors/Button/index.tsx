import { UserComponent, useNode, UserComponentConfig } from '@craftjs/core';
import cx from 'classnames';
import React from 'react';
import { ButtonSettings } from './ButtonSettings';

import { Text } from '../Text';

type ButtonProps = {
  background?: Record<'r' | 'g' | 'b' | 'a', number>;
  color?: Record<'r' | 'g' | 'b' | 'a', number>;
  buttonStyle?: string;
  margin?: any[];
  text?: string;
  textComponent?: any;
};

export const Button: UserComponent<ButtonProps> = (props: any) => {
  const {
    connectors: { connect, drag },
  } = useNode((node) => ({
    selected: node.events.selected,
  }));
  const { text, textComponent, color, margin, background, ...otherProps } = props;
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
    toolbar: ButtonSettings,
  },
};
