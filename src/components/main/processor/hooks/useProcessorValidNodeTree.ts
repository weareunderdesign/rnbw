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
import { useAppState } from "@_redux/useAppState";

export const useProcessorValidNodeTree = () => {
  const dispatch = useDispatch();
  const {
    validNodeTree,
    nExpandedItems,
    nSelectedItems,
    newFocusedNodeUid,
    updateOptions,
  } = useAppState();
  const { removeRunningActions } = useContext(MainContext);

  useEffect(() => {
    if (updateOptions?.from === "file") {
      // when a new file is opened
      const uids = Object.keys(validNodeTree);
      dispatch(expandNodeTreeNodes(uids.slice(0, 50)));
    } else {
      // when have any changes
      const _expandedItems = nExpandedItems.filter(
        (uid) => validNodeTree[uid] && validNodeTree[uid].isEntity === false,
      );
      const _selectedItems = nSelectedItems.filter((uid) => validNodeTree[uid]);

      dispatch(focusNodeTreeNode(newFocusedNodeUid));
      dispatch(expandNodeTreeNodes([..._expandedItems]));
      dispatch(selectNodeTreeNodes([..._selectedItems, newFocusedNodeUid]));
    }
    removeRunningActions(["processor-validNodeTree"]);
  }, [validNodeTree]);
};
