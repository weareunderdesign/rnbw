import React, {
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  Attributes,
  getShortHand,
} from '@_node/html';
import { TNode } from '@_node/types';
import * as Main from '@_redux/main';
import { MainContext } from '@_redux/main';

import { NodeRendererProp } from './types';

export default function NodeRenderer({ id }: NodeRendererProp) {
  const dispatch = useDispatch()

  // main context
  const { ffHoveredItem, setFFHoveredItem, ffHandlers, setFFHandlers, fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree, command } = useContext(MainContext)

  // redux state
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(Main.fnSelector)

  // hover, select sync
  useEffect(() => {
    /* dom?.classList.remove('rnbwdev-rainbow-component-hovered', 'rnbwdev-rainbow-component-selected')

    selected ? (dom?.classList.add('rnbwdev-rainbow-component-selected')) :
      id === fnHoveredItem ? dom?.classList.add('rnbwdev-rainbow-component-hovered') : null

    hovered && setFNHoveredItem(id) */
  }, [fnHoveredItem])

  const node = useMemo<TNode>(() => nodeTree[id], [nodeTree, id])
  const Tag = useMemo<keyof JSX.IntrinsicElements>(() => {
    return (node === undefined ? '' :
      node.name === 'html' ? 'div' :
        node.name === 'head' ? 'div' :
          node.name === 'body' ? 'div' :
            node.name) as keyof JSX.IntrinsicElements
  }, [node])
  const attribs = useMemo<Attributes>(() => {
    return node === undefined ? {} : getShortHand(node.data.attribs)
  }, [node])

  const onMouseMove = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    setFNHoveredItem(id)
    // console.log('onMouseEnter', id)
  }, [id])
  const onMouseLeave = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    // setFNHoveredItem('')
    // console.log('onMouseLeave', id)
  }, [id])
  const onClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    dispatch(Main.focusFNNode(id))
    // console.log('onClick', id)
  }, [id])
  const onDoubleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    // console.log('onDoubleClick', id)
  }, [id])

  const className = useMemo(() => {
    return id === focusedItem ? 'rnbwdev-rainbow-component-focus' :
      id === fnHoveredItem ? 'rnbwdev-rainbow-component-hover' : ''
  }, [id, focusedItem, fnHoveredItem])

  return <>
    {node !== undefined && !node.data.isFormatText && (
      node.name === 'ROOT' ? node.children.map(c_uid => <NodeRenderer key={c_uid} id={c_uid}></NodeRenderer>) :
        node.name === '!doctype' ? null :
          node.name === 'meta' ? <Tag
            {...attribs}
          /> :
            node.name === 'link' ? <Tag
              {...attribs}
            /> :
              node.name === 'img' ? <Tag
                {...attribs}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                className={attribs.className === undefined ? className : `${attribs.className} ${className}`}
              /> :
                node.name === 'comment' ? null :
                  node.name === 'text' ? node.data.data :
                    <Tag
                      {...attribs}
                      onMouseMove={onMouseMove}
                      onMouseLeave={onMouseLeave}
                      onClick={onClick}
                      onDoubleClick={onDoubleClick}
                      className={attribs.className === undefined ? className : `${attribs.className} ${className}`}
                    >
                      {node.children.map(c_uid => <NodeRenderer key={c_uid} id={c_uid}></NodeRenderer>)}
                    </Tag>
    )}
  </>
}