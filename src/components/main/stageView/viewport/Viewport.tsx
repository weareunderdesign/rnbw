import React, {
  useContext,
  useEffect,
  useRef,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { getBfsUids } from '@_node/apis';
import {
  getElementType,
  getShortHand,
  isCanvas,
} from '@_node/html';
import {
  TNode,
  TUid,
} from '@_node/types';
import * as Main from '@_redux/main';
import { MainContext } from '@_redux/main';
import {
  EditorState,
  FreshNode,
  Node,
  Nodes,
  useEditor,
} from '@craftjs/core';

import { ViewportProps } from './types';

export default function Viewport(props: ViewportProps) {
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
  const { workspace, openedFiles, currentFile: { uid: currentFileUid, type, content }, pending, messages } = useSelector(Main.globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(Main.fnSelector)

  // useEditor
  const {
    actions,
    query,
    nodes,
    selectedNodeIds,
    hoveredNodeIds,
    draggedNodeIds,
  } = useEditor((state: EditorState, _query) => ({
    nodes: _query.getNodes(),
    selectedNodeIds: state.events.selected,
    hoveredNodeIds: state.events.selected,
    draggedNodeIds: state.events.dragged,
  }))

  // ---------------- sync with the state ----------------
  // select items from redux to stageView - to avoid nodes which are invalid to render
  useEffect(() => {
    let _selectedItems: TUid[] = []
    Object.keys(nodes).map((uid) => {
      if (selectedItemsObj[uid] === true || uid === focusedItem) {
        _selectedItems.push(uid)
      }
    })
    actions.selectNode(_selectedItems)
  }, [selectedItemsObj, focusedItem])

  // select nodes from stageView to redux
  useEffect(() => {
    let _selectedItems: TUid[] = []
    selectedNodeIds.forEach((nodeId) => {
      if (nodeId === 'ROOT') return
      _selectedItems.push(nodeId)
    })
    if (_selectedItems.length === 0) return

    // check if the same
    let same = true
    if (selectedItems.length === _selectedItems.length) {
      for (const selectedItem of _selectedItems) {
        if (selectedItemsObj[selectedItem] === undefined) {
          same = false
          break
        }
      }
    } else {
      same = false
    }
    if (same) return

    addRunningAction(['selectNodesOnStageView'])
    dispatch(Main.selectFNNode(_selectedItems))
    dispatch(Main.focusFNNode(_selectedItems[0]))
    const expandedItems: TUid[] = []
    let node = validNodeTree[_selectedItems[0]]
    while (node.uid !== 'ROOT') {
      const parentNode = validNodeTree[node.p_uid as TUid]
      expandedItems.push(parentNode.uid)
      node = parentNode
    }
    dispatch(Main.expandFNNode(expandedItems))
    removeRunningAction(['selectNodesOnStageView'])
  }, [selectedNodeIds])

  // update the editor based on the file content
  useEffect(() => {
    // clear
    const rootNode = query.getNodes()['ROOT']
    if (rootNode !== undefined) {
      rootNode.data.nodes.map((c_uid) => {
        actions.delete(c_uid)
      })
    }

    // get&parse Fresh Nodes to Nodes and add them to the Tree
    const _nodes: Nodes = {}
    const uids = getBfsUids(Object.keys(nodeTree))
    uids.map((uid) => {
      const node: TNode = nodeTree[uid]
      const nodeType = getElementType(node.name)
      const _isCanvas = isCanvas(node.name)

      if (node.data.isFormatText === true || nodeType === 'invalid') return

      const parentNodeUid = node.p_uid === null ? undefined : node.p_uid

      let attribs = node.data.attribs
      attribs = attribs === undefined ? {} : getShortHand(attribs)

      const freshNode: FreshNode = {
        id: uid,
        data: {
          custom: node,

          props: attribs,

          type: nodeType,
          isCanvas: _isCanvas,

          name: node.name,
          displayName: node.name,

          linkedNodes: {},
          parent: parentNodeUid,
          nodes: [],
          hidden: false,
        },
      }
      /* 
      export declare type NodeData = {
        props: Record<string, any>;
        type: string | React.ElementType;
        name: string;
        displayName: string;
        isCanvas: boolean;
        parent: NodeId;
        linkedNodes: Record<string, NodeId>;
        nodes: NodeId[];
        hidden: boolean;
        custom?: any;
        _childCanvas?: Record<string, NodeId>;
      };
      */
      _nodes[uid] = query.parseFreshNode(freshNode).toNode((_node: Node) => { })
      parentNodeUid !== undefined && _nodes[parentNodeUid].data.nodes.push(uid)
    })

    if (_nodes['ROOT'] === undefined) return

    console.log('nodeTree changed', _nodes)
    actions.addNodeTree({ rootNodeId: 'ROOT', nodes: _nodes })
    console.log('addNodeTree done!')
  }, [nodeTree])
  // ---------------- sync with the state ----------------

  return <>
    <div className="viewport" style={{ width: "100%" }}>
      {props.children}
    </div>
  </>
}