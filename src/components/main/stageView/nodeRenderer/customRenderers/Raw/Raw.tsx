import React from 'react';

import { RawProps } from './types';

function Raw(props: RawProps) {
  /* const {
    selected,
    connectors: { connect, drag },
  } = useNode((node) => ({
    selected: node.events.selected,
  })) */
  const CustomTag = `h1`
  return <>
    <CustomTag>
      1212
    </CustomTag>
    {props.children}
  </>
}

export default Raw