import React, { useEffect } from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { parseHtml } from '@_components/main/stageView/api';
import * as Main from '@_redux/main';
import {
  FreshNode,
  Node,
  NodeId,
  NodeTree,
  useEditor,
} from '@craftjs/core';

import { Container } from '../../selectors';

export type ViewportProps =
  {
    children: any,
  }

export default function Viewport(props: ViewportProps) {
  const dispatch = useDispatch()
  const {
    enabled,
    actions,
    query,
    selectedNodeIds,
    hoveredNodeIds
  } = useEditor((state) => ({
    enabled: state.options.enabled,
    selectedNodeIds: state.events.selected,
    hoveredNodeIds: state.events.hovered
  }));

  const selectedItems = useSelector(Main.fnGetSelectedItemsSelector)
  const focusedItem = useSelector(Main.fnGetFocusedItemSelector)
  const { uid, type, content } = useSelector(Main.globalGetCurrentFileSelector)

  useEffect(() => {
    const nodes: Record<string, Node> = query.getNodes()
    let curSelectedItems: string[] = []
    Object.keys(nodes).map((uid) => {
      nodes[uid].dom?.classList.remove("component-selected")
      nodes[uid].dom?.classList.remove("component-hovered")
      selectedItems.findIndex((cid) => cid == uid) >= 0
        ? (nodes[uid].dom?.classList.add("component-selected"), curSelectedItems.push(uid))
        : focusedItem === uid
          ? nodes[uid].dom?.classList.add("component-hovered")
          : {}
    })
    actions.selectNode(curSelectedItems)
  }, [selectedItems, focusedItem])
  useEffect(() => {
    // fire selected Node Event
    let curSelectedItems: string[] = []
    selectedNodeIds.forEach((nodeId) => {
      curSelectedItems.push(nodeId)
    });
    if (curSelectedItems.length) {
      // console.log(selectedItems, curSelectedItems)
      if (selectedItems.length != 0 && JSON.stringify([...selectedItems].sort()) === JSON.stringify([...curSelectedItems].sort()))
        return
      dispatch(Main.selectFNNode(curSelectedItems))
    }
  }, [selectedNodeIds])

  useEffect(() => {
    // fire focus Node Event
    let hoveredItems: string[] = []
    hoveredNodeIds.forEach((nodeId) => {
      hoveredItems.push(nodeId)
    });
    if (hoveredItems.length) {
      dispatch(Main.focusFNNode(hoveredItems[0]))
    }
    // console.log("hover:", hoveredItems)
  }, [hoveredNodeIds])

  useEffect(() => {
    if (content !== "" && type == "html") {

      let root_node = JSON.parse(JSON.stringify(query.node("ROOT").get().data))

      // clear nodes inside ROOT
      const nodes: Record<NodeId, Node> = query.getNodes()
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

  return (
    <div className="viewport" style={{ width: "100%" }}>
      {props.children}
    </div>
  );
};

