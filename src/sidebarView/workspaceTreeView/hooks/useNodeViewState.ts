import { getObjKeys } from "@src/helper";
import { useCallback } from "react";

import { useDispatch } from "react-redux";

import { getValidNodeUids } from "@_api/helpers";
import { TNodeUid } from "@_api/types";
import {
  collapseFileTreeNodes,
  expandFileTreeNodes,
  focusFileTreeNode,
  selectFileTreeNodes,
} from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";
import { addRunningAction, removeRunningAction } from "@_redux/main/processor";

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
    fSelectedItemsObj: selectedItemsObj,
  } = useAppState();

  const cb_focusNode = useCallback(
    (uid: TNodeUid) => {
      dispatch(addRunningAction());
      if (invalidFileNodes[uid] || focusedItem === uid || !fileTree[uid]) {
        dispatch(removeRunningAction());
        return;
      }

      dispatch(focusFileTreeNode(uid));
      dispatch(removeRunningAction());
    },
    [invalidFileNodes, focusedItem, fileTree],
  );

  const cb_selectNode = useCallback(
    (uids: TNodeUid[]) => {
      dispatch(addRunningAction());
      let _uids = [...uids];
      _uids = _uids.filter((_uid) => !invalidFileNodes[_uid] && fileTree[_uid]);
      if (_uids.length === 0) {
        dispatch(removeRunningAction());
        return;
      }

      _uids = getValidNodeUids(fileTree, _uids);
      if (_uids.length === getObjKeys(selectedItemsObj).length) {
        let same = true;
        for (const _uid of _uids) {
          if (!selectedItemsObj[_uid]) {
            same = false;
            break;
          }
        }
        if (same) {
          dispatch(removeRunningAction());
          return;
        }
      }

      dispatch(selectFileTreeNodes(_uids));
      dispatch(removeRunningAction());
    },
    [invalidFileNodes, fileTree, selectedItemsObj],
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
