import React, {
  useEffect,
  useRef,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { parseHtml } from '@_components/main/stageView/api';
import { TUid } from '@_node/types';
import * as Main from '@_redux/main';
import {
  FreshNode,
  Node,
  NodeTree,
  useEditor,
} from '@craftjs/core';

import { Container } from '../../selectors';
import { ViewportProps } from './types';

export default function Viewport(props: ViewportProps) {
  const dispatch = useDispatch()
  const {
    connectors,
    actions,
    query,
    selectedNodeIds,
  } = useEditor((state) => ({
    selectedNodeIds: state.events.selected,
  }))

  // fetch necessary state
  const focusedItem = useSelector(Main.fnGetFocusedItemSelector)
  const selectedItems = useSelector(Main.fnGetSelectedItemsSelector)
  const selectedItemsObj = useSelector(Main.fnGetSelectedItemsObjSelector)
  const nodeTree = useSelector(Main.globalGetNodeTreeSelector)
  const { type, content } = useSelector(Main.globalGetCurrentFileSelector)

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

  // sync with the state
  useEffect(() => {
    const nodes: Record<TUid, Node> = query.getNodes()
    let _selectedItems: TUid[] = []
    Object.keys(nodes).map((uid) => {
      if (selectedItemsObj[uid] === true || uid === focusedItem) {
        _selectedItems.push(uid)
      }
    })
    actions.selectNode(_selectedItems)
  }, [selectedItemsObj, focusedItem])
  useEffect(() => {
    let _selectedItems: TUid[] = []
    selectedNodeIds.forEach((nodeId) => {
      if (nodeId === 'ROOT') return
      _selectedItems.push(nodeId)
    })
    if (_selectedItems.length === 0) return

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

    addRunningAction(['selectFNNode', 'focusFNNode', 'expandFNNode'])
    dispatch(Main.selectFNNode(_selectedItems))
    dispatch(Main.focusFNNode(_selectedItems[0] === 'ROOT' ? 'root' : _selectedItems[0]))
    const expandedItems: TUid[] = []
    let node = nodeTree[_selectedItems[0]]
    while (node.uid !== 'root') {
      const parentNode = nodeTree[node.p_uid as TUid]
      expandedItems.push(parentNode.uid)
      node = parentNode
    }
    dispatch(Main.expandFNNode(expandedItems))
    removeRunningAction(['selectFNNode', 'focusFNNode', 'expandFNNode'])
  }, [selectedNodeIds])

  // update the editor based on the file content
  useEffect(() => {
    if (content === '') {
      const nodes: Record<TUid, Node> = query.getNodes()
      nodes['ROOT'].data.nodes.map((c_uid) => {
        actions.delete(c_uid)
      })
      return
    }

    if (content !== "" && type === "html") {
      let root_node = JSON.parse(JSON.stringify(query.node("ROOT").get().data))

      // clear nodes inside ROOT
      const nodes: Record<TUid, Node> = query.getNodes()
      nodes["root"] !== undefined ? actions.delete("root") : {}
      // parseHTML fresh nodes

      const nodetree: Record<string, FreshNode> = parseHtml(content)
      let customtree: NodeTree = {
        rootNodeId: "ROOT",
        nodes: {}
      }
      // convert fresh nodes to nodes
      let root_child_nodes: string[] = []
      Object.keys(nodetree).map((key, index) => {
        const node = query.parseFreshNode(nodetree[key]).toNode()
        node.id = key
        customtree.nodes[node.id] = node
        if (node.data.parent == "ROOT") {
          root_child_nodes.push(node.id)
        }
        // index == 0 ? customtree.rootNodeId = node.id : {}
      })
      root_node.nodes = root_child_nodes
      root_node.type = Container
      customtree.nodes["ROOT"] = query.parseFreshNode({
        id: "ROOT",
        data: root_node
      }).toNode()
      actions.addNodeTree(customtree);
    }
  }, [content])

  return <>
    <div className="viewport" style={{ width: "100%" }}>
      {props.children}
    </div>
  </>
}