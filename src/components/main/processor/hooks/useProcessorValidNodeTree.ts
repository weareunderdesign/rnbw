import { useContext, useEffect, useRef } from "react";

import { useDispatch } from "react-redux";

import { MainContext } from "@_redux/main";
import {
  expandNodeTreeNodes,
  focusNodeTreeNode,
  selectNodeTreeNodes,
} from "@_redux/main/nodeTree";
import { useAppState } from "@_redux/useAppState";

export const useProcessorValidNodeTree = () => {
  const dispatch = useDispatch();
  const {
    currentFileUid,
    prevFileUid,

    validNodeTree,
    nExpandedItems,
    nSelectedItems,
    newFocusedNodeUid,
  } = useAppState();
  const { removeRunningActions } = useContext(MainContext);

  const isFirstOpenForCurrentFile = useRef(false);
  useEffect(() => {
    isFirstOpenForCurrentFile.current = currentFileUid !== prevFileUid;
  }, [currentFileUid]);

  useEffect(() => {
    if (isFirstOpenForCurrentFile.current) {
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
