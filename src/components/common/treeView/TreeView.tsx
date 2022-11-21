import React, { useMemo } from 'react';

import {
  ControlledTreeEnvironment,
  Tree,
  TreeItemIndex,
} from 'react-complex-tree';

import { TreeViewProps } from './types';

export default function TreeView(props: TreeViewProps): JSX.Element {
  const width: string = useMemo(() => props.width, [props.width])
  const height: string = useMemo(() => props.height, [props.height])

  const data = useMemo(() => props.data, [props.data])

  const focusedItem: TreeItemIndex = useMemo(() => props.focusedItem, [props.focusedItem])
  const expandedItems: TreeItemIndex[] = useMemo(() => props.expandedItems, [props.expandedItems])
  const selectedItems: TreeItemIndex[] = useMemo(() => props.selectedItems, [props.selectedItems])

  return (<>
    <div style={{
      cursor: "pointer",
      color: "#dddddd",
      fontSize: "12px",
    }}>
      <ControlledTreeEnvironment
        viewState={{
          'tree': {
            expandedItems: expandedItems,
            focusedItem: focusedItem,
            selectedItems: selectedItems,
          }
        }}

        getItemTitle={(item) => {
          return item.data.name
        }} // string rendered at the tree view

        {...props.renderers}

        {...props.props}

        {...props.callbacks}

        // Load Data
        items={data}
      >
        <Tree treeId="tree" rootItem="root" treeLabel="Tree" />
      </ControlledTreeEnvironment>
    </div>
  </>)
}