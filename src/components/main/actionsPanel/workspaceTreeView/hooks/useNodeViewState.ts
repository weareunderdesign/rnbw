import { useCallback, useContext } from "react";

import { useDispatch } from "react-redux";

import { getValidNodeUids } from "@_node/helpers";
import { TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import {
  collapseFileTreeNodes,
  expandFileTreeNodes,
  focusFileTreeNode,
  selectFileTreeNodes,
} from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";

import { useInvalidNodes } from "./";

export const useNodeViewState = () => {
  const dispatch = useDispatch();
  const {
    fileTree,
    fFocusedItem: focusedItem,
    fExpandedItemsObj: expandedItemsObj,
    fSelectedItems: selectedItems,
    fSelectedItemsObj: selectedItemsObj,
  } = useAppState();
  const { addRunningActions, removeRunningActions } = useContext(MainContext);

  const { invalidNodes } = useInvalidNodes();

  const cb_focusNode = useCallback(
    (uid: TNodeUid) => {
      if (
        invalidNodes[uid] ||
        focusedItem === uid ||
        fileTree[uid] === undefined
      ) {
        removeRunningActions(["fileTreeView-focus"]);
        return;
      }

      addRunningActions(["fileTreeView-focus"]);
      dispatch(focusFileTreeNode(uid));
      removeRunningActions(["fileTreeView-focus"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      invalidNodes,
      focusedItem,
      fileTree,
    ],
  );
  const cb_selectNode = useCallback(
    (uids: TNodeUid[]) => {
      let _uids = [...uids];
      _uids = _uids.filter((_uid) => !invalidNodes[_uid] && fileTree[_uid]);
      if (_uids.length === 0) {
        removeRunningActions(["fileTreeView-select"]);
        return;
      }

      _uids = getValidNodeUids(fileTree, _uids);
      if (_uids.length === selectedItems.length) {
        let same = true;
        for (const _uid of _uids) {
          if (selectedItemsObj[_uid] === undefined) {
            same = false;
            break;
          }
        }
        if (same) {
          removeRunningActions(["fileTreeView-select"]);
          return;
        }
      }

      addRunningActions(["fileTreeView-select"]);
      dispatch(selectFileTreeNodes(_uids));
      removeRunningActions(["fileTreeView-select"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      fileTree,
      invalidNodes,
      selectedItems,
      selectedItemsObj,
    ],
  );
  const cb_expandNode = useCallback(
    (uid: TNodeUid) => {
      if (
        invalidNodes[uid] ||
        fileTree[uid] === undefined ||
        fileTree[uid].isEntity ||
        expandedItemsObj[uid]
      ) {
        removeRunningActions(["fileTreeView-expand"]);
        return;
      }

      addRunningActions(["fileTreeView-expand"]);
      dispatch(expandFileTreeNodes([uid]));
      removeRunningActions(["fileTreeView-expand"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      invalidNodes,
      fileTree,
      expandedItemsObj,
    ],
  );
  const cb_collapseNode = useCallback(
    (uid: TNodeUid) => {
      if (
        invalidNodes[uid] ||
        fileTree[uid] === undefined ||
        fileTree[uid].isEntity ||
        !expandedItemsObj[uid]
      ) {
        removeRunningActions(["fileTreeView-collapse"]);
        return;
      }

      addRunningActions(["fileTreeView-collapse"]);
      dispatch(collapseFileTreeNodes([uid]));
      removeRunningActions(["fileTreeView-collapse"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      invalidNodes,
      fileTree,
      expandedItemsObj,
    ],
  );

  return {
    cb_focusNode,
    cb_selectNode,
    cb_expandNode,
    cb_collapseNode,
  };
};
