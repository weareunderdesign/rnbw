import { FreshNode, Nodes, NodeTree, QueryMethods, useEditor, Node, NodeId, useNode, NodeRules } from '@craftjs/core';
import cx from 'classnames';

import React, { useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { globalGetCurrentFileSelector } from '@_redux/global';


import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toolbox } from './Toolbox';
import { parseHtml } from '@_components/main/stageView/api';

import { Text } from '../../selectors/Text/index'
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
    selectedNodeId
  } = useEditor((state) => ({
    enabled: state.options.enabled,
    selectedNodeId: state.events.selected
  }));

  const [ selected, setSelected ] = useState<Object>({})

  const { uid, type, content } = useSelector(globalGetCurrentFileSelector)
  useEffect(() => {
    const currentNodeId = query.getEvent('selected').last();
    console.log(selectedNodeId)
    if (currentNodeId) {
      setSelected({
        id: currentNodeId,
        name: query.getState().nodes[currentNodeId].data.name,
        settings:
          query.getState().nodes[currentNodeId].related &&
          query.getState().nodes[currentNodeId].related.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      });
      // call reducer
    }
  }, [selectedNodeId])

  useEffect(() => {
    console.log(query.parseReactElement(<h1>asdfsadf</h1>).toNodeTree())

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
      console.log(customtree)
      actions.addNodeTree(customtree);
    }
  }, [content])

  return (
    <div className="viewport" style={{ width: "100%" }}>
      {props.children}
    </div>
  );
};
