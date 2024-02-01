import { useCallback, useContext } from "react";

import { useDispatch } from "react-redux";

import { getValidNodeUids } from "@_node/helpers";
import { TNodeUid } from "@_node/types";
import {
  collapseFileTreeNodes,
  expandFileTreeNodes,
  focusFileTreeNode,
  selectFileTreeNodes,
} from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";
import { MainContext } from "@_redux/main";

interface IUseNodeViewState {
  invalidFileNodes: {
    [uid: string]: true;
  };
}
export const useNodeViewState = ({ invalidFileNodes }: IUseNodeViewState) => {
  const dispatch = useDispatch();
  const {
    fileTree,
    fFocusedItem: focusedItem,
    fExpandedItemsObj: expandedItemsObj,
    fSelectedItems: selectedItems,
    fSelectedItemsObj: selectedItemsObj,
  } = useAppState();
  const { removeRunningActions } = useContext(MainContext);

  const cb_focusNode = useCallback(
    (uid: TNodeUid) => {
      if (invalidFileNodes[uid] || focusedItem === uid || !fileTree[uid]) {
        removeRunningActions(["fileTreeView-focus"]);
        return;
      }

      dispatch(focusFileTreeNode(uid));
      removeRunningActions(["fileTreeView-focus"]);
    },
    [invalidFileNodes, focusedItem, fileTree],
  );
  const cb_selectNode = useCallback(
    (uids: TNodeUid[]) => {
      let _uids = [...uids];
      _uids = _uids.filter((_uid) => !invalidFileNodes[_uid] && fileTree[_uid]);
      if (_uids.length === 0) {
        removeRunningActions(["fileTreeView-select"]);
        return;
      }

      _uids = getValidNodeUids(fileTree, _uids);
      if (_uids.length === selectedItems.length) {
        let same = true;
        for (const _uid of _uids) {
          if (!selectedItemsObj[_uid]) {
            same = false;
            break;
          }
        }
        if (same) {
          removeRunningActions(["fileTreeView-select"]);
          return;
        }
      }

      dispatch(selectFileTreeNodes(_uids));
      removeRunningActions(["fileTreeView-select"]);
    },
    [invalidFileNodes, fileTree, selectedItems, selectedItemsObj],
  );
  const cb_expandNode = useCallback(
    (uid: TNodeUid) => {
      if (
        invalidFileNodes[uid] ||
        !fileTree[uid] ||
        fileTree[uid].isEntity ||
        expandedItemsObj[uid]
      )
        return;

      dispatch(expandFileTreeNodes([uid]));
    },
    [invalidFileNodes, fileTree, expandedItemsObj],
  );
  const cb_collapseNode = useCallback(
    (uid: TNodeUid) => {
      if (
        invalidFileNodes[uid] ||
        !fileTree[uid] ||
        fileTree[uid].isEntity ||
        !expandedItemsObj[uid]
      )
        return;

      dispatch(collapseFileTreeNodes([uid]));
    },
    [invalidFileNodes, fileTree, expandedItemsObj],
  );

  return {
    cb_focusNode,
    cb_selectNode,
    cb_expandNode,
    cb_collapseNode,
  };
};
