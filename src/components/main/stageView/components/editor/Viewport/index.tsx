import React, { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

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
import { useDispatch } from 'react-redux';

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

  const { uid, type, content } = useSelector(Main.globalGetCurrentFileSelector)
  
  useEffect(() => {
    console.log(selectedItems)
    actions.selectNode(selectedItems)

    // selectedItems.map((uid) => {
    //   query.node(uid).get().dom?.classList.add("component-selected")
    // })
  }, [selectedItems])
  useEffect(() => {
    // fire selected Node Event
    let selectedItems: string[] = []
    selectedNodeIds.forEach((nodeId) => {
      selectedItems.push(nodeId)
    });
    if (selectedItems.length) {
      dispatch(Main.selectFNNode(selectedItems))
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

