import React, { useEffect } from 'react';

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
    hoveredNodeIds
  } = useEditor((state) => ({
    selectedNodeIds: state.events.selected,
    hoveredNodeIds: state.events.hovered
  }))

  // fetch necessary state
  const focusedItem = useSelector(Main.fnGetFocusedItemSelector)
  const selectedItems = useSelector(Main.fnGetSelectedItemsSelector)
  const selectedItemsObj = useSelector(Main.fnGetSelectedItemsObjSelector)
  const { uid, type, content } = useSelector(Main.globalGetCurrentFileSelector)

  // sync with the state
  useEffect(() => {
    const nodes: Record<TUid, Node> = query.getNodes()
    let _selectedItems: TUid[] = []
    Object.keys(nodes).map((uid) => {
      const node = nodes[uid]
      node.dom?.classList.remove("component-selected")
      if (selectedItemsObj[uid] === true) {
        node.dom?.classList.add("component-selected")
        _selectedItems.push(uid)
      }
    })
    actions.selectNode(_selectedItems)
  }, [selectedItemsObj])
  useEffect(() => {
    const nodes: Record<TUid, Node> = query.getNodes()
    Object.keys(nodes).map((uid) => {
      const node = nodes[uid]
      node.dom?.classList.remove("component-hovered")
      if (focusedItem !== 'root' && focusedItem === uid) {
        node.dom?.classList.add("component-hovered")
      }
    })
  }, [focusedItem])
  useEffect(() => {
    let _selectedItems: TUid[] = []
    selectedNodeIds.forEach((nodeId) => {
      _selectedItems.push(nodeId)
    })

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

    !same && dispatch(Main.selectFNNode(_selectedItems))
  }, [selectedNodeIds])
  useEffect(() => {
    let hoveredItems: TUid[] = []
    hoveredNodeIds.forEach((nodeId) => {
      hoveredItems.push(nodeId)
    })

    if (hoveredItems.length === 0) return

    console.log('hoverNodeIds changed', hoveredNodeIds)

    dispatch(Main.focusFNNode(hoveredItems[0] === 'ROOT' ? 'root' : hoveredItems[0]))
  }, [hoveredNodeIds])

  // update the editor based on the file content
  useEffect(() => {
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