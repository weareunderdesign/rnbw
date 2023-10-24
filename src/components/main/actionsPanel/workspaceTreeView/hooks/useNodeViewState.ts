import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { TNodeUid } from "@_node/types";
import {
  MainContext,
  collapseFFNode,
  expandFFNode,
  ffSelector,
  focusFFNode,
  navigatorSelector,
  selectFFNode,
} from "@_redux/main";
import { useInvalidNodes } from ".";
import { getValidNodeUids } from "@_node/apis";

export const useNodeViewState = () => {
  const dispatch = useDispatch();

  const { file } = useSelector(navigatorSelector);
  const { focusedItem, expandedItemsObj, selectedItems, selectedItemsObj } =
    useSelector(ffSelector);

  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // navigator
    project,
    // file tree view
    ffTree,
  } = useContext(MainContext);

  const { invalidNodes } = useInvalidNodes();

  const cb_focusNode = useCallback(
    (uid: TNodeUid) => {
      // validate
      if (
        invalidNodes[uid] ||
        focusedItem === uid ||
        ffTree[uid] === undefined
      ) {
        removeRunningActions(["fileTreeView-focus"], false);
        return;
      }

      addRunningActions(["fileTreeView-focus"]);
      dispatch(focusFFNode(uid));
      removeRunningActions(["fileTreeView-focus"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      invalidNodes,
      focusedItem,
      ffTree,
    ],
  );
  const cb_selectNode = useCallback(
    (uids: TNodeUid[]) => {
      // validate
      let _uids = [...uids];
      _uids = _uids.filter((_uid) => {
        return !(ffTree[_uid] === undefined);
      });
      if (_uids.length === 0) {
        removeRunningActions(["fileTreeView-select"], false);
        return;
      }
      _uids = getValidNodeUids(ffTree, _uids);
      if (_uids.length === selectedItems.length) {
        let same = true;
        for (const _uid of _uids) {
          if (selectedItemsObj[_uid] === undefined) {
            same = false;
            break;
          }
        }
        if (same) {
          removeRunningActions(["fileTreeView-select"], false);
          return;
        }
      }
      if (project && file) {
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
          file.uid.replace("ROOT/", "") +
          `' + window.location.search });
		  `;
        document.head.appendChild(script);
      }
      addRunningActions(["fileTreeView-select"]);
      dispatch(selectFFNode(_uids));
      removeRunningActions(["fileTreeView-select"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      ffTree,
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
        ffTree[uid] === undefined ||
        ffTree[uid].isEntity ||
        expandedItemsObj[uid]
      ) {
        removeRunningActions(["fileTreeView-expand"], false);
        return;
      }

      addRunningActions(["fileTreeView-expand"]);
      dispatch(expandFFNode([uid]));
      removeRunningActions(["fileTreeView-expand"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      invalidNodes,
      ffTree,
      expandedItemsObj,
    ],
  );
  const cb_collapseNode = useCallback(
    (uid: TNodeUid) => {
      // validate
      if (
        invalidNodes[uid] ||
        ffTree[uid] === undefined ||
        ffTree[uid].isEntity ||
        !expandedItemsObj[uid]
      ) {
        removeRunningActions(["fileTreeView-collapse"], false);
        return;
      }

      addRunningActions(["fileTreeView-collapse"]);
      dispatch(collapseFFNode([uid]));
      removeRunningActions(["fileTreeView-collapse"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      invalidNodes,
      ffTree,
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
