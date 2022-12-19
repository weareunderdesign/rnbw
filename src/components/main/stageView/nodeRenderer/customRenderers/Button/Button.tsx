import React from 'react';

import { ButtonProps } from './types';

function Button(props: ButtonProps) {
  /* const {
    selected,
    connectors: { connect, drag },
  } = useNode((node) => ({
    selected: node.events.selected,
  })) */

  return <>
    <button
    /* ref={ref => connect(drag(ref as HTMLElement))} */
    >
      {props.children}
    </button >
  </>
}

export default Button