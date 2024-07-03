import { useCallback } from "react";

import { useDispatch } from "react-redux";

import { getValidNodeUids } from "@_node/helpers";
import { TNodeUid } from "@_node/types";
import {
  collapseNodeTreeNodes,
  expandNodeTreeNodes,
  setSelectedNodeUids,
} from "@_redux/main/nodeTree";
import { addRunningAction, removeRunningAction } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { getObjKeys } from "@src/helper";

export function useNodeViewState() {
  const dispatch = useDispatch();
  const {
    fileTree,
    currentFileUid,
    renderableFileUid,

    validNodeTree,
    nSelectedItemsObj: selectedItemsObj,
  } = useAppState();

  const cb_focusNode = useCallback(() => {
    dispatch(addRunningAction());
    dispatch(removeRunningAction());
  }, []);

  const cb_selectNode = useCallback(
    (uids: TNodeUid[]) => {
      dispatch(addRunningAction());
      // validate
      const _uids = getValidNodeUids(validNodeTree, uids);
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
      dispatch(setSelectedNodeUids(_uids));
      dispatch(removeRunningAction());
    },
    [
      fileTree,
      currentFileUid,
      renderableFileUid,
      validNodeTree,
      selectedItemsObj,
    ],
  );

  const cb_expandNode = useCallback((uid: TNodeUid) => {
    dispatch(addRunningAction());

    dispatch(expandNodeTreeNodes([uid]));

    dispatch(removeRunningAction());
  }, []);

  const cb_collapseNode = useCallback((uid: TNodeUid) => {
    dispatch(addRunningAction());

    dispatch(collapseNodeTreeNodes([uid]));

    dispatch(removeRunningAction());
  }, []);

  return { cb_focusNode, cb_selectNode, cb_expandNode, cb_collapseNode };
}
