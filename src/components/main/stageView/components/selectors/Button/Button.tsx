import React from 'react';

import {
  useNode,
  UserComponent,
} from '@craftjs/core';

import Text from '../Text';
import { ButtonProps } from './types';

const Button: UserComponent<ButtonProps> = (props: ButtonProps) => {
  const {
    selected,
    connectors: { connect, drag },
  } = useNode((node) => ({
    selected: node.events.selected,
  }))

  return <>
    <button
      ref={ref => connect(drag(ref as HTMLElement))}
      style={props.style}
    >
      <Text text={props.children}></Text>
    </button >
  </>
}

export default Button