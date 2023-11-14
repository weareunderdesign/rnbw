import { useCallback, useContext } from "react";

import { useDispatch, useSelector } from "react-redux";

import { getValidNodeUids } from "@_node/apis";
import { TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import {
  collapseFileTreeNodes,
  currentFileUidSelector,
  expandFileTreeNodes,
  fileTreeSelector,
  fileTreeViewStateSelector,
  focusFileTreeNode,
  projectSelector,
  selectFileTreeNodes,
} from "@_redux/main/fileTree";

import { useInvalidNodes } from "./";

export const useNodeViewState = () => {
  const dispatch = useDispatch();

  const project = useSelector(projectSelector);
  const fileTree = useSelector(fileTreeSelector);
  const currentFileUid = useSelector(currentFileUidSelector);

  const { focusedItem, expandedItemsObj, selectedItems, selectedItemsObj } =
    useSelector(fileTreeViewStateSelector);

  const {
    // global action
    addRunningActions,
    removeRunningActions,
  } = useContext(MainContext);

  const { invalidNodes } = useInvalidNodes();

  const cb_focusNode = useCallback(
    (uid: TNodeUid) => {
      // validate
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
      // validate
      let _uids = [...uids];
      _uids = _uids.filter((_uid) => {
        return !(fileTree[_uid] === undefined);
      });
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
      /* if (project && currentFileUid) {
        // remove exist script
        const exist = document.head.querySelector("#custom-plausible");
        if (exist !== null) {
          document.head.removeChild(exist);
        }
        // plausible analytics
        var script = document.createElement("script");
        script.id = "custom-plausible";
        script.textContent =
          `
			plausible('pageview', { u: '` +
          "rnbw.dev/" +
          project.name +
          "/" +
          currentFileUid.replace("ROOT/", "") +
          `' + window.location.search });
		  `;
        document.head.appendChild(script);
      } */
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
      // validate
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
      // validate
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
    cb_expandNode,
    cb_collapseNode,
    cb_selectNode,
    cb_focusNode,
  };
};
