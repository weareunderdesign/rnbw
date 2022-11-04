import React, {
  useMemo,
  useState,
} from 'react';

import {
  ControlledTreeEnvironment,
  Tree,
} from 'react-complex-tree';

import { longTree } from './data';
import { renderers } from './renders';
import styles from './TreeView.module.scss';

export default function TreeView(props: TreeViewProps): JSX.Element {
  const width: string = useMemo(() => props.width, [props.width])
  const height: string = useMemo(() => props.height, [props.height])

  const [data, setData] = useState(longTree.items)

  const [focusedItem, setFocusedItem] = useState(undefined)
  const [expandedItems, setExpandedItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])

  return (<>
    <div className={styles.TreeView}>
      <ControlledTreeEnvironment
        viewState={{
          'tree': {
            expandedItems: expandedItems,
            focusedItem: focusedItem,
            selectedItems: selectedItems,
          }
        }}

        getItemTitle={(item) => item.data} // string rendered at the tree view

        {...renderers}

        /* keyboardBindings={{
          expandSiblings: ['control+*'],
          moveFocusToFirstItem: ['home'],
          moveFocusToLastItem: ['end'],
          primaryAction: ['enter'], 
          renameItem: ['f2'],
          abortRenameItem: ['escape'],
          toggleSelectItem: ['control+space'],
          abortSearch: ['escape', 'enter'],
          startSearch: ['control+f'],
          selectAll: ['control+a'],
          startProgrammaticDnd: ['control+d'],
          completeProgrammaticDnd: ['enter'],
          abortProgrammaticDnd: ['escape'],
        }} */

        /* showLiveDescription={true}
        liveDescriptors={{
          introduction: '123',
          renamingItem: 'a',
          searching: '123',
          programmaticallyDragging: 'pro',
          programmaticallyDraggingTarget: 'prog'
        }} */

        /* POSSIBILITIES */
        canRename={true}
        canDragAndDrop={true}
        canDropOnItemWithChildren={true}
        canDropOnItemWithoutChildren={true}
        canReorderItems={true}
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
        }}

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
        }}
        onAbortRenamingItem={(item, treeId) => {
          console.log('onAbortRenamingItem', item, treeId)
        }}

        /* SELECT, FOCUS, EXPAND, COLLAPSE CALLBACK */
        onSelectItems={(items, treeId) => {
          console.log('onSelectItems', items, treeId)
          setSelectedItems(items)
        }}
        onFocusItem={(item, treeId) => {
          console.log('onFocusItem', item, treeId)
          setFocusedItem(item.index)
        }}
        onExpandItem={(item, treeId) => {
          console.log('onExpandItem', item, treeId)
          setExpandedItems([...expandedItems, item.index])
        }}
        onCollapseItem={(item, treeId) => {
          console.log('onCollapseItem', item, treeId)
          setExpandedItems(expandedItems.filter(expandedItemIndex => expandedItemIndex !== item.index))
        }}
        onMissingItems={(itemIds) => {
          console.log('onMissingItems', itemIds)
        }}
        onMissingChildren={(itemIds) => {
          console.log('onMissingChildren', itemIds)
        }}

        // DnD CALLBACK
        onDrop={(items, target) => {
          console.log('onDrop', items, target)
        }}

        // primary action
        /* onPrimaryAction={(items, treeId) => {
          console.log('onPrimaryAction', items, treeId)
        }} */
        // ref

        // Load Data
        items={data}
      >
        <Tree treeId="tree" rootItem="root" treeLabel="Tree" />
      </ControlledTreeEnvironment>
    </div>
  </>)
}