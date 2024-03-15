import React, { useMemo } from "react";

import { ControlledTreeEnvironment, Tree } from "react-complex-tree";

import { RootNodeUid } from "@_constants/main";

import { TreeViewProps } from "./types";

export default function TreeView(props: TreeViewProps) {
  const width = useMemo(() => props.width, [props.width]);
  const height = useMemo(() => props.height, [props.height]);

  const info = useMemo(() => props.info, [props.info]);

  const data = useMemo(() => props.data, [props.data]);

  const focusedItem = useMemo(() => props.focusedItem, [props.focusedItem]);
  const expandedItems = useMemo(
    () => props.expandedItems,
    [props.expandedItems],
  );
  const selectedItems = useMemo(
    () => props.selectedItems,
    [props.selectedItems],
  );
  const viewState = useMemo(() => {
    const state: { [treeId: string]: object } = {};
    state[info.id] = {
      focusedItem,
      selectedItems,
      expandedItems,
    };
    return state;
  }, [info.id, focusedItem, expandedItems, selectedItems]);

  return (
    <div style={{ width, height }}>
      <ControlledTreeEnvironment
        {...props.renderers}
        {...props.callbacks}
        {...props.props}
        items={data}
        getItemTitle={(item) => item.data.displayName}
        viewState={viewState}
        keyboardBindings={{
          primaryAction: ["Space"],
          moveFocusToFirstItem: [],
          moveFocusToLastItem: [],
          expandSiblings: [],
          renameItem: ["F2"],
          abortRenameItem: ["Escape"],
          toggleSelectItem: [],
          abortSearch: [],
          startSearch: [],
          selectAll: [],
          startProgrammaticDnd: [],
          abortProgrammaticDnd: [],
          completeProgrammaticDnd: [],
        }}
      >
        <Tree treeId={info.id} treeLabel={info.label} rootItem={RootNodeUid} />
      </ControlledTreeEnvironment>
    </div>
  );
}
