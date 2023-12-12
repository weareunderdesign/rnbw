import { useCallback } from "react";

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
  const { invalidNodes } = useInvalidNodes();

  const cb_focusNode = useCallback(
    (uid: TNodeUid) => {
      if (invalidNodes[uid] || focusedItem === uid || !fileTree[uid]) return;

      dispatch(focusFileTreeNode(uid));
    },
    [invalidNodes, focusedItem, fileTree],
  );
  const cb_selectNode = useCallback(
    (uids: TNodeUid[]) => {
      let _uids = [...uids];
      _uids = _uids.filter((_uid) => !invalidNodes[_uid] && fileTree[_uid]);
      if (_uids.length === 0) return;

      _uids = getValidNodeUids(fileTree, _uids);
      if (_uids.length === selectedItems.length) {
        let same = true;
        for (const _uid of _uids) {
          if (!selectedItemsObj[_uid]) {
            same = false;
            break;
          }
        }
        if (same) return;
      }

      dispatch(selectFileTreeNodes(_uids));
    },
    [invalidNodes, fileTree, selectedItems, selectedItemsObj],
  );
  const cb_expandNode = useCallback(
    (uid: TNodeUid) => {
      if (
        invalidNodes[uid] ||
        !fileTree[uid] ||
        fileTree[uid].isEntity ||
        expandedItemsObj[uid]
      )
        return;

      dispatch(expandFileTreeNodes([uid]));
    },
    [invalidNodes, fileTree, expandedItemsObj],
  );
  const cb_collapseNode = useCallback(
    (uid: TNodeUid) => {
      if (
        invalidNodes[uid] ||
        !fileTree[uid] ||
        fileTree[uid].isEntity ||
        !expandedItemsObj[uid]
      )
        return;

      dispatch(collapseFileTreeNodes([uid]));
    },
    [invalidNodes, fileTree, expandedItemsObj],
  );

  return {
    cb_focusNode,
    cb_selectNode,
    cb_expandNode,
    cb_collapseNode,
  };
};
