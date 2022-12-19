import React, {
  useContext,
  useEffect,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import * as Main from '@_redux/main';
import { MainContext } from '@_redux/main';
import { useNode } from '@craftjs/core';

import { RenderNodeProp } from './types';

export default function NodeRenderer(props: RenderNodeProp) {
  const dispatch = useDispatch()

  // main context
  const { ffHoveredItem, setFFHoveredItem, ffHandlers, setFFHandlers, fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree, command } = useContext(MainContext)

  // redux state
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(Main.fnSelector)

  // useNode
  const {
    id,
    data,
    hovered,
    selected,
    dom,
  } = useNode((node) => {
    return {
      data: node.data,
      hovered: node.events.hovered,
      selected: node.events.selected,
      dom: node.dom,
    }
  })

  useEffect(() => {
    console.log(123)
  }, [])
  
  // hover, select sync
  useEffect(() => {
    dom?.classList.remove('rnbwdev-rainbow-component-hovered', 'rnbwdev-rainbow-component-selected')

    selected ? (dom?.classList.add('rnbwdev-rainbow-component-selected')) :
      id === fnHoveredItem ? dom?.classList.add('rnbwdev-rainbow-component-hovered') : null

    hovered && setFNHoveredItem(id)
  }, [selected, fnHoveredItem, hovered])

  return <>
    {props.render}
  </>
}