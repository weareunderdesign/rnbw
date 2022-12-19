import React, { useState } from 'react';

import {
  Node,
  useNode,
} from '@craftjs/core';

import { TextProps } from './types';

function Text(props: TextProps) {
  const {
    node,
  } = useNode((node: Node) => {
    return {
      node,
    }
  })

  const [editable, setEditable] = useState(false)

  return <>
    {node.data.custom.data.data}
  </>
}

export default Text