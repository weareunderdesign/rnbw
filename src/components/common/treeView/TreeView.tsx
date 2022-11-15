import React, { useMemo } from 'react';

import {
  ControlledTreeEnvironment,
  DraggingPositionItem,
  Tree,
  TreeItemIndex,
} from 'react-complex-tree';

import { UID } from '@_types/global';

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
          const dataType = typeof item.data
          if (dataType === 'string') {
            return item.data
          } else {
            return item.data.name
          }
        }} // string rendered at the tree view

        {...props.renderers}

        /* POSSIBILITIES */
        canDragAndDrop={true}
        canDropOnItemWithChildren={true}
        canDropOnItemWithoutChildren={false}
        canReorderItems={true}
        canSearch={true}
        /* canRename={true}
        canDrag={(items) => {
          return true
        }}
        canDropAt={(items, target) => {
          return true
        }}
        canInvokePrimaryActionOnItemContainer={true}
        canSearch={true}
        canSearchByStartingTyping={true}
        autoFocus={true}
        doesSearchMatchItem={(search, item, itemTitle) => {
          return true
        }} */

        /* Tree CALLBACK */
        onRegisterTree={(tree) => {
          console.log('onRegisterTree', tree)
        }}
        onUnregisterTree={(tree) => {
          console.log('onUnregisterTree', tree)
        }}

        /* RENAME CALLBACK */
        onStartRenamingItem={(item, treeId) => {
          console.log('onStartRenamingItem', item, treeId)
        }}
        onRenameItem={(item, name, treeId) => {
          console.log('onRenameItem', item, name, treeId)
          props.cb_renameNode && props.cb_renameNode(item.index as UID, name)
        }}
        onAbortRenamingItem={(item, treeId) => {
          console.log('onAbortRenamingItem', item, treeId)
        }}

        /* SELECT, FOCUS, EXPAND, COLLAPSE CALLBACK */
        onSelectItems={(items, treeId) => {
          console.log('onSelectItems', items)
          props.cb_selectNode(items as UID[])
        }}
        onFocusItem={(item, treeId) => {
          console.log('onFocusItem', item.index)
          props.cb_focusNode(item.index as UID)
        }}
        onExpandItem={(item, treeId) => {
          console.log('onExpandItem', item.index)
          props.cb_expandNode(item.index as UID)
        }}
        onCollapseItem={(item, treeId) => {
          console.log('onCollapseItem', item.index)
          props.cb_collapseNode(item.index as UID)
        }}

        /* MISSING CALLBACK */
        onMissingItems={(itemIds) => {
          console.log('onMissingItems', itemIds)
        }}
        onMissingChildren={(itemIds) => {
          console.log('onMissingChildren', itemIds)
        }}

        // DnD CALLBACK
        onDrop={(items, target) => {
          console.log('onDrop', items, target)
          const uids: UID[] = []
          for (const item of items) {
            uids.push(item.index as string)
          }

          if (target.targetType === 'between-items') {
            /* target.parentItem
            target.childIndex
            target.linePosition */
          } else if (target.targetType === 'item') {
            /* target.targetItem */
          }

          const targetUID: UID = (target as DraggingPositionItem).targetItem as string
          console.log('onDrop', uids, targetUID)
          props.cb_dropNode && props.cb_dropNode(uids, targetUID)
        }}

        // primary action
        onPrimaryAction={(item, treeId) => {
          console.log('onPrimaryAction', item.index, treeId)
          props.cb_readNode && props.cb_readNode(item.index as UID)
        }}

        // ref

        // Load Data
        items={data}
      >
        <Tree treeId="tree" rootItem="root" treeLabel="Tree" />
      </ControlledTreeEnvironment>
    </div>
  </>)
}