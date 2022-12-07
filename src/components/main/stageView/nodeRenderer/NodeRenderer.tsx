import React, { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import * as Main from '@_redux/main';
import { useNode } from '@craftjs/core';

import { RenderNodeProp } from './types';

export default function NodeRenderer(props: RenderNodeProp) {
  const dispatch = useDispatch()

  const {
    id: nodeId,
    hovered,
    selected,
    dom,
  } = useNode((node) => ({
    hovered: node.events.hovered,
    selected: node.events.selected,
    dom: node.dom,
  }))

  useEffect(() => {
    if (nodeId === 'ROOT') return

    dom?.classList.remove('component-selected', 'component-hovered')
    selected && dom?.classList.add('component-selected')
    hovered && dom?.classList.add('component-hovered')

    hovered && dispatch(Main.hoverFNNode(nodeId))
  }, [selected, hovered])

  return <>
    {props.render}
  </>
}