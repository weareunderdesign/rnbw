import React from 'react';

import { useNode } from '@craftjs/core';

import { ContainerProps } from './types';

export const Container/* : UserComponent<ContainerProps> */ = ({ children, ...attributes }: ContainerProps) => {
  const {
    id,
    node,
    connectors: { connect, drag },
  } = useNode((node) => ({
    node
  }))

  // const attribsHtml = useMemo(() => data.attribs === undefined ? '' : Object.keys(data.attribs).map(attr => ` ${attr}="${data.attribs[attr]}"`).join(''), [data.attribs])

  return (
    <div {...attributes} {...node.data.props}>
      {children}
    </div>
  )
}