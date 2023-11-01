import { useContext, useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";

import { MainContext } from "@_redux/main";
import {
  expandNodeTreeNodes,
  focusNodeTreeNode,
  nodeTreeViewStateSelector,
  selectNodeTreeNodes,
  validNodeTreeSelector,
} from "@_redux/main/nodeTree";
import { updateOptionsSelector } from "@_redux/main/processor";

export const useProcessorValidNodeTree = () => {
  const dispatch = useDispatch();

  const validNodeTree = useSelector(validNodeTreeSelector);
  const updateOptions = useSelector(updateOptionsSelector);

  const { expandedItems, selectedItems } = useSelector(
    nodeTreeViewStateSelector,
  );
  const {
    // global action
    removeRunningActions,
    // code view
    newFocusedNodeUid,
  } = useContext(MainContext);

  useEffect(() => {
    if (!updateOptions) return;

    if (
      updateOptions.parse === null &&
      (updateOptions.from === "file" || updateOptions.from === null)
    ) {
      const uids = Object.keys(validNodeTree);
      dispatch(expandNodeTreeNodes(uids.slice(0, 50)));
      removeRunningActions(["processor-validNodeTree"], false);
    } else if (updateOptions.parse === null && updateOptions.from === "code") {
      const _focusedItem = newFocusedNodeUid;
      const _expandedItems = expandedItems.filter((uid) => {
        return (
          validNodeTree[uid] !== undefined &&
          validNodeTree[uid].isEntity === false
        );
      });
      const _selectedItems = selectedItems.filter((uid) => {
        return validNodeTree[uid] !== undefined;
      });
      // dispatch(clearFNState()); TODO: clearFNState
      dispatch(focusNodeTreeNode(_focusedItem));
      dispatch(expandNodeTreeNodes([..._expandedItems]));
      dispatch(selectNodeTreeNodes([..._selectedItems, _focusedItem]));
      removeRunningActions(["processor-validNodeTree"], false);
    } else if (updateOptions.parse === null && updateOptions.from === "node") {
      removeRunningActions(["processor-validNodeTree"], false);
    } else {
      removeRunningActions(["processor-validNodeTree"], false);
    }
  }, [validNodeTree]);
};
