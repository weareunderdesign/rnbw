import { useCallback, useContext } from "react";

import { useDispatch } from "react-redux";

import { getValidNodeUids } from "@_node/helpers";
import { TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { selectFileTreeNodes, setCurrentFileUid } from "@_redux/main/fileTree";
import {
  collapseNodeTreeNodes,
  expandNodeTreeNodes,
  NodeTree_Event_ClearActionType,
  setSelectedNodeUids,
} from "@_redux/main/nodeTree";
import { setNavigatorDropdownType } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

export function useNodeViewState(focusItemValue: TNodeUid | null) {
  const dispatch = useDispatch();
  const {
    validNodeTree,
    prevRenderableFileUid,
    nFocusedItem: focusedItem,
    nSelectedItems: selectedItems,
    nSelectedItemsObj: selectedItemsObj,
  } = useAppState();
  const { addRunningActions, removeRunningActions } = useContext(MainContext);

  const {
    // toasts
    parseFileFlag,
    setParseFile,
  } = useContext(MainContext);

  const cb_focusNode = useCallback((uid: TNodeUid) => {}, []);

  const cb_selectNode = useCallback(
    (uids: TNodeUid[]) => {
      console.log("useNodeViewState - select", uids);

      addRunningActions(["nodeTreeView-select"]);
      // validate
      const _uids = getValidNodeUids(validNodeTree, uids);
      if (_uids.length === selectedItems.length) {
        let same = true;
        for (const _uid of _uids) {
          if (selectedItemsObj[_uid] === undefined) {
            same = false;
            break;
          }
        }
        if (same) {
          removeRunningActions(["nodeTreeView-select"]);
          return;
        }
      }

      dispatch(setSelectedNodeUids(_uids));

      if (!parseFileFlag) {
        const uid = prevRenderableFileUid;
        setParseFile(true);
        dispatch(setNavigatorDropdownType("project"));
        dispatch({ type: NodeTree_Event_ClearActionType });
        dispatch(setCurrentFileUid(uid));
        dispatch(selectFileTreeNodes([prevRenderableFileUid]));
      }
      removeRunningActions(["nodeTreeView-select"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      validNodeTree,
      selectedItems,
      selectedItemsObj,
      parseFileFlag,
    ],
  );

  const cb_expandNode = useCallback(
    (uid: TNodeUid) => {
      addRunningActions(["nodeTreeView-arrow"]);

      dispatch(expandNodeTreeNodes([uid]));

      removeRunningActions(["nodeTreeView-arrow"]);
    },
    [addRunningActions, removeRunningActions],
  );

  const cb_collapseNode = useCallback(
    (uid: TNodeUid) => {
      addRunningActions(["nodeTreeView-arrow"]);

      dispatch(collapseNodeTreeNodes([uid]));

      removeRunningActions(["nodeTreeView-arrow"]);
    },
    [addRunningActions, removeRunningActions],
  );

  return { cb_focusNode, cb_selectNode, cb_expandNode, cb_collapseNode };
}
