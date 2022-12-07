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
    if (nodeId === 'ROOT') return
    selected ? [dom?.classList.remove('component-hovered'), dom?.classList.add('component-selected')] : dom?.classList.remove('component-selected')
  }, [selected])
  useEffect(() => {
    if (selected) true
    hoveredItem === nodeId ? dom?.classList.add('component-hovered') : dom?.classList.remove('component-hovered')
  }, [hoveredItem])
  useEffect(() => {
    hoveredItem !== nodeId && nodeId !== 'ROOT' && dispatch(Main.hoverFNNode(nodeId))
  }, [hovered])

  return <>
    {props.render}
  </>
}