import React, { useMemo } from 'react';

import {
  ControlledTreeEnvironment,
  Tree,
} from 'react-complex-tree';

import { TreeViewProps } from './types';

export default function TreeView(props: TreeViewProps) {
  // styles
  const width: string = useMemo(() => props.width, [props.width])
  const height: string = useMemo(() => props.height, [props.height])
  // tree id, label
  const info = useMemo(() => props.info, [props.info])
  // render items
  const data = useMemo(() => props.data, [props.data])
  // view state
  const focusedItem = useMemo(() => props.focusedItem, [props.focusedItem])
  const expandedItems = useMemo(() => props.expandedItems, [props.expandedItems])
  const selectedItems = useMemo(() => props.selectedItems, [props.selectedItems])
  const viewState = useMemo(() => {
    const state: { [treeId: string]: object } = {}
    state[info.id] = {
      focusedItem,
      selectedItems,
      expandedItems,
    }
    return state
  }, [info.id, focusedItem, expandedItems, selectedItems])

  return <>
    <div style={{ width: width, height: height }}>
      <ControlledTreeEnvironment
        viewState={viewState}
        getItemTitle={(item) => {
          return item.data.name
        }}
        {...props.renderers}
        {...props.props}
        {...props.callbacks}
        items={data}
        keyboardBindings={{
          primaryAction: ['Space'],
          moveFocusToFirstItem: [],
          moveFocusToLastItem: [],
          expandSiblings: [],
          renameItem: ['F2'],
          abortRenameItem: ['Escape'],
          toggleSelectItem: [],
          abortSearch: [],
          startSearch: [],
          selectAll: [],
          startProgrammaticDnd: [],
          abortProgrammaticDnd: [],
          completeProgrammaticDnd: [],
        }}
      >
        <Tree treeId={info.id} rootItem="ROOT" treeLabel={info.label} />
      </ControlledTreeEnvironment>
    </div>
  </>
}