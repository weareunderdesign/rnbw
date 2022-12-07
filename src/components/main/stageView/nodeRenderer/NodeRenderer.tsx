import React, { useEffect } from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import * as Main from '@_redux/main';
import { useNode } from '@craftjs/core';

import { RenderNodeProp } from './types';

export default function NodeRenderer(props: RenderNodeProp) {
  const dispatch = useDispatch()

  // fetch necessary state
  const hoveredItem = useSelector(Main.fnGetHoveredItemSelector)

  // useNode
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

  // hover, select sync
  useEffect(() => {
    dom?.classList.remove('component-hovered', 'component-selected')

    selected ? (nodeId !== 'ROOT' && dom?.classList.add('component-selected')) :
      (nodeId === hoveredItem || (nodeId === 'ROOT' && hoveredItem === 'root')) ? (nodeId !== 'ROOT' && dom?.classList.add('component-hovered')) :
        (hovered && dispatch(Main.hoverFNNode(nodeId === 'ROOT' ? 'root' : nodeId)))
  }, [selected, hovered, hoveredItem])

  return <>
    {props.render}
  </>
}