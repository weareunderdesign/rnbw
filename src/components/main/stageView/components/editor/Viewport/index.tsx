import React, { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { parseHtml } from '@_components/main/stageView/api';
import { globalGetCurrentFileSelector } from '@_redux/main';
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
  const {
    enabled,
    actions,
    query,
    selectedNodeId,
  } = useEditor((state) => ({
    enabled: state.options.enabled,
    selectedNodeId: state.events.selected
  }));

  const { uid, type, content } = useSelector(globalGetCurrentFileSelector)

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
