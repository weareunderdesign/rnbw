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

import { RootNodeUid } from '@_constants/main';
import {
  getShortHand,
  THtmlNodeData,
  THtmlTagAttributes,
} from '@_node/html';
import { TNode } from '@_node/types';
import {
  fnSelector,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  MainContext,
  navigatorSelector,
} from '@_redux/main';

import { StageViewContext } from '../context';
import { NodeRendererProp } from './types';

export default function NodeRenderer({ id }: NodeRendererProp) {
  const dispatch = useDispatch()

  // main context
  const {
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree, updateFF,

    // ndoe tree view
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,

    // update opt
    updateOpt, setUpdateOpt,

    // ff hms
    isHms, setIsHms, ffAction, setFFAction,

    // cmdk
    currentCommand, setCurrentCommand, cmdkOpen, setCmdkOpen, cmdkPages, setCmdkPages, cmdkPage,

    // global
    pending, setPending, messages, addMessage, removeMessage,

    // reference
    htmlReferenceData, cmdkReferenceData, cmdkReferenceJumpstart, cmdkReferenceActions, cmdkReferenceAdd,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    osType,

    // code view
    tabSize, setTabSize,
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file, openedFiles } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)

  // stageView context
  const { setFocusedItem } = useContext(StageViewContext)

  // build node info
  const node = useMemo<TNode>(() => nodeTree[id], [nodeTree, id])
  const Tag = useMemo<keyof JSX.IntrinsicElements>(() => {
    if (node === undefined || node.name === 'text') return '' as keyof JSX.IntrinsicElements

    return true ? (node.name === 'html' ? 'div' :
      node.name === 'head' ? 'div' :
        node.name === 'body' ? 'div' :
          node.name) as keyof JSX.IntrinsicElements :
      node.name as keyof JSX.IntrinsicElements

  }, [node])
  const abbr = useMemo<boolean>(() => {
    if (node === undefined) return false

    const data = htmlReferenceData.elements[node.name]
    if (data && data.Content === 'None') return true

    // tmp - we don't need this if the reference is perfect
    // skip img tag - it has its own renderer
    if (node.name === 'meta' || node.name === 'link'
      || node.name === 'br' || node.name === 'hr'
      || node.name === 'source' || node.name === 'input'
      || node.name === 'area' || node.name === 'col' || node.name === 'wbr') return true

    return false
  }, [node])

  // need to continue to improve
  const attribs = useMemo<THtmlTagAttributes>(() => {
    return node === undefined ? {} : getShortHand((node.data as THtmlNodeData).attribs)
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
    {node !== undefined && !(node.data as THtmlNodeData).isFormatText && (
      node.name === RootNodeUid ? node.children.map(c_uid => <NodeRenderer key={c_uid} id={c_uid}></NodeRenderer>) :
        node.name === '!doctype' ? null :
          abbr ? <Tag {...attribs} /> :
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
                node.name === 'text' ? ((node.data as THtmlNodeData).data) :
                  node.name === 'div' ? <>
                    {true ?
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
                      : <Resizable
                        width={width}
                        height={height}
                        onResizeStart={(e: React.SyntheticEvent, data: ResizeCallbackData) => {
                          // console.log('onResizeStart', e, data)
                          setWidth(data.size.width)
                          setHeight(data.size.height)
                        }}
                        onResizeStop={(e: React.SyntheticEvent, data: ResizeCallbackData) => {
                          // console.log('onResizeStop', e, data)
                          setWidth(data.size.width)
                          setHeight(data.size.height)
                        }}
                        onResize={(e: React.SyntheticEvent, data: ResizeCallbackData) => {
                          // console.log('onResize', e, data)
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
                      </Resizable>}
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