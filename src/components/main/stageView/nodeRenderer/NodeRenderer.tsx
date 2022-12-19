import React, {
  FormEvent,
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { Resizable } from 'react-resizable';

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

  // for groupping action - it contains the actionNames as keys which should be in the same group
  const runningActions = useRef<{ [actionName: string]: boolean }>({})
  const noRunningAction = () => {
    return Object.keys(runningActions.current).length === 0 ? true : false
  }
  const addRunningAction = (actionNames: string[]) => {
    for (const actionName of actionNames) {
      runningActions.current[actionName] = true
    }
  }
  const removeRunningAction = (actionNames: string[], effect: boolean = true) => {
    for (const actionName of actionNames) {
      delete runningActions.current[actionName]
    }
    if (effect && noRunningAction()) {
      dispatch(Main.increaseActionGroupIndex())
    }
  }

  // main context
  const { ffHoveredItem, setFFHoveredItem, ffHandlers, setFFHandlers, fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree, command } = useContext(MainContext)

  // redux state
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(Main.fnSelector)

  // buidl node info
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
  const [contentEditable, setContentEditable] = useState<boolean>(false)

  // events
  const onMouseMove = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    setFNHoveredItem(id)
  }, [id])
  const onClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    dispatch(Main.focusFNNode(id))
  }, [id])
  const onDoubleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    setContentEditable(true)
  }, [])
  const onInput = useCallback((e: FormEvent) => {
    e.stopPropagation()
    console.log('onInput', (e.target as HTMLElement).innerHTML)
  }, [])

  // sync with the redux
  useEffect(() => {
    if (id !== focusedItem)
      setContentEditable(false)
  }, [focusedItem])
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
              node.name === 'br' ? <Tag
                {...attribs}
              /> :
                node.name === 'img' ? <Tag
                  {...attribs}
                  onMouseMove={onMouseMove}
                  onClick={onClick}
                  onDoubleClick={onDoubleClick}
                  className={attribs.className === undefined ? className : `${attribs.className} ${className}`}
                  contentEditable={contentEditable}
                  suppressContentEditableWarning={true}
                  onInput={onInput}
                /> :
                  node.name === 'comment' ? null :
                    node.name === 'text' ? (node.data.data) :
                      node.name === 'div' ? <Resizable width={200} height={200} draggableOpts={{}}
                        minConstraints={[100, 100]} maxConstraints={[300, 300]}>
                        <Tag
                          {...attribs}
                          onMouseMove={onMouseMove}
                          onClick={onClick}
                          onDoubleClick={onDoubleClick}
                          className={attribs.className === undefined ? className : `${attribs.className} ${className}`}
                          contentEditable={contentEditable}
                          suppressContentEditableWarning={true}
                          onInput={onInput}
                        >
                          {node.children.map(c_uid => <NodeRenderer key={c_uid} id={c_uid}></NodeRenderer>)}
                        </Tag>
                      </Resizable> :
                        <Tag
                          {...attribs}
                          onMouseMove={onMouseMove}
                          onClick={onClick}
                          onDoubleClick={onDoubleClick}
                          className={attribs.className === undefined ? className : `${attribs.className} ${className}`}
                          contentEditable={contentEditable}
                          suppressContentEditableWarning={true}
                          onInput={onInput}
                        >
                          {node.children.map(c_uid => <NodeRenderer key={c_uid} id={c_uid}></NodeRenderer>)}
                        </Tag>
    )}
  </>
}