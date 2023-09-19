import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getValidNodeUids } from "@_node/apis";
import { TNodeUid } from "@_node/types";
import { TFileNodeData } from "@_node/file";

import {
  collapseFNNode,
  expandFNNode,
  fnSelector,
  focusFNNode,
  MainContext,
  selectFFNode,
  selectFNNode,
  setCurrentFile,
} from "@_redux/main";

import { HmsClearActionType } from "@_constants/main";

export function useNodeViewState(focusItemValue: TNodeUid | null) {
  const dispatch = useDispatch();
  const { focusedItem, selectedItems, selectedItemsObj } =
    useSelector(fnSelector);
  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // node actions
    setNavigatorDropDownType,
    // file tree view
    ffTree,
    setCurrentFileUid,
    // node tree view
    validNodeTree,
    // other
    theme: _theme,
    // toasts
    parseFileFlag,
    setParseFile,
    prevFileUid,
  } = useContext(MainContext);

  const cb_focusNode = useCallback(
    (uid: TNodeUid) => {
      addRunningActions(["nodeTreeView-focus"]);

      // validate
      if (focusedItem === uid) {
        removeRunningActions(["nodeTreeView-focus"], false);
        return;
      }

      dispatch(focusFNNode(uid));
      focusItemValue = uid;

      removeRunningActions(["nodeTreeView-focus"]);
    },
    [addRunningActions, removeRunningActions, focusedItem],
  );

  const cb_selectNode = useCallback(
    (uids: TNodeUid[]) => {
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
          removeRunningActions(["nodeTreeView-select"], false);
          return;
        }
      }

      dispatch(selectFNNode(_uids));

      if (!parseFileFlag) {
        const node = ffTree[prevFileUid];
        const uid = prevFileUid;
        const nodeData = node.data as TFileNodeData;
        setParseFile(true);
        setNavigatorDropDownType("project");
        dispatch({ type: HmsClearActionType });
        dispatch(
          setCurrentFile({
            uid,
            parentUid: node.parentUid as TNodeUid,
            name: nodeData.name,
            content: nodeData.contentInApp ? nodeData.contentInApp : "",
          }),
        );
        setCurrentFileUid(uid);
        dispatch(selectFFNode([prevFileUid]));
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

      dispatch(expandFNNode([uid]));

      removeRunningActions(["nodeTreeView-arrow"]);
    },
    [addRunningActions, removeRunningActions],
  );

  const cb_collapseNode = useCallback(
    (uid: TNodeUid) => {
      addRunningActions(["nodeTreeView-arrow"]);

      dispatch(collapseFNNode([uid]));

      removeRunningActions(["nodeTreeView-arrow"]);
    },
    [addRunningActions, removeRunningActions],
  );

  return { cb_focusNode, cb_selectNode, cb_expandNode, cb_collapseNode };
}
