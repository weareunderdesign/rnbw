import React, {
  FormEvent,
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';
import {
  Resizable,
  ResizeCallbackData,
} from 'react-resizable';

import {
  getShortHand,
  THtmlTagAttributes,
} from '@_node/html';
import { TNode } from '@_node/types';
import {
  fnSelector,
  globalSelector,
  MainContext,
} from '@_redux/main';

import { StageViewContext } from '../context';
import { NodeRendererProp } from './types';

export default function NodeRenderer({ id }: NodeRendererProp) {
  const dispatch = useDispatch()

  // main context
  const {
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, updateFF,
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,
    command, setCommand,
    pending, setPending, messages, addMessage, removeMessage,
  } = useContext(MainContext)

  // redux state
  const { project, currentFile } = useSelector(globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // stageView context
  const { setFocusedItem } = useContext(StageViewContext)

  // build node info
  const node = useMemo<TNode>(() => nodeTree[id], [nodeTree, id])
  const Tag = useMemo<keyof JSX.IntrinsicElements>(() => {
    return (node === undefined ? '' :
      node.name === 'html' ? 'div' :
        node.name === 'head' ? 'div' :
          node.name === 'body' ? 'div' :
            node.name) as keyof JSX.IntrinsicElements
  }, [node])
  const attribs = useMemo<THtmlTagAttributes>(() => {
    return node === undefined ? {} : getShortHand(node.data.attribs)
  }, [node])
  const className = useMemo(() => {
    return id === focusedItem ? 'rnbwdev-rainbow-component-focus' :
      id === fnHoveredItem ? 'rnbwdev-rainbow-component-hover' : ''
  }, [id, focusedItem, fnHoveredItem])

  // event handlers
  const onMouseMove = useCallback((e: MouseEvent) => {
    e.stopPropagation()

    setFNHoveredItem(id)
  }, [id])
  const onClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()

    setFocusedItem(id)
  }, [id, setFocusedItem])
  const onDoubleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()

    setContentEditable(true)
  }, [])

  // resize
  const [width, setWidth] = useState(200)
  const [height, setHeight] = useState(200)

  // text edit
  const [contentEditable, setContentEditable] = useState<boolean>(false)
  const [innerHtml, setInnerHtml] = useState<string>('')
  const onInput = useCallback((e: FormEvent) => {
    e.stopPropagation()

    setInnerHtml((e.target as HTMLElement).innerHTML)
  }, [])
  const onTextEdit = (innerHtml: string) => {
  }
  useEffect(() => {
    if (id !== focusedItem) {
      contentEditable === true && onTextEdit(innerHtml)
      setContentEditable(false)
    } else {
      // do nothing
    }
  }, [focusedItem])

  return <>
    {node !== undefined && !node.data.isFormatText && (
      node.name === 'ROOT' ? node.children.map(c_uid => <NodeRenderer key={c_uid} id={c_uid}></NodeRenderer>) :
        node.name === '!doctype' ? null :
          node.name === 'meta' ? <Tag {...attribs} /> :
            node.name === 'link' ? <Tag {...attribs} /> :
              node.name === 'br' ? <Tag {...attribs} /> :
                node.name === 'img' ? <Tag
                  {...attribs}
                  className={attribs.className === undefined ? className : `${attribs.className} ${className}`}

                  onMouseMove={onMouseMove}
                  onClick={onClick}
                  onDoubleClick={onDoubleClick}

                  suppressContentEditableWarning={true}
                  contentEditable={contentEditable}
                  onInput={onInput}
                /> :
                  node.name === 'comment' ? null :
                    node.name === 'text' ? (node.data.data) :
                      node.name === 'div' ? <>
                        <Resizable
                          width={width}
                          height={height}
                          onResizeStart={(e: React.SyntheticEvent, data: ResizeCallbackData) => {
                            console.log('onResizeStart', e, data)
                            setWidth(data.size.width)
                            setHeight(data.size.height)
                          }}
                          onResizeStop={(e: React.SyntheticEvent, data: ResizeCallbackData) => {
                            console.log('onResizeStop', e, data)
                            setWidth(data.size.width)
                            setHeight(data.size.height)
                          }}
                          onResize={(e: React.SyntheticEvent, data: ResizeCallbackData) => {
                            console.log('onResize', e, data)
                            setWidth(data.size.width)
                            setHeight(data.size.height)
                          }}
                          draggableOpts={{}}
                          minConstraints={[100, 100]}
                          maxConstraints={[300, 300]}
                        >
                          <Tag
                            {...attribs}
                            className={attribs.className === undefined ? className : `${attribs.className} ${className}`}

                            onMouseMove={onMouseMove}
                            onClick={onClick}
                            onDoubleClick={onDoubleClick}

                            suppressContentEditableWarning={true}
                            contentEditable={contentEditable}
                            onInput={onInput}
                          >
                            {node.children.map(c_uid => <NodeRenderer key={c_uid} id={c_uid}></NodeRenderer>)}
                          </Tag>
                        </Resizable>
                      </> : <>
                        <Tag
                          {...attribs}
                          className={attribs.className === undefined ? className : `${attribs.className} ${className}`}

                          onMouseMove={onMouseMove}
                          onClick={onClick}
                          onDoubleClick={onDoubleClick}

                          suppressContentEditableWarning={true}
                          contentEditable={contentEditable}
                          onInput={onInput}
                        >
                          {node.children.map(c_uid => <NodeRenderer key={c_uid} id={c_uid}></NodeRenderer>)}
                        </Tag>
                      </>
    )}
  </>
}