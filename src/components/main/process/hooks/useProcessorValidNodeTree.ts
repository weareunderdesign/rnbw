import { useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearFNState,
  expandFNNode,
  fnSelector,
  focusFNNode,
  MainContext,
  selectFNNode,
} from "@_redux/main";

export const useProcessorValidNodeTree = () => {
  const dispatch = useDispatch();

  const { expandedItems, selectedItems } = useSelector(fnSelector);
  const {
    // global action
    removeRunningActions,
    // node tree view
    validNodeTree,
    // code view
    newFocusedNodeUid,
    // processor
    updateOpt,
  } = useContext(MainContext);

  useEffect(() => {
    if (
      updateOpt.parse === null &&
      (updateOpt.from === "file" || updateOpt.from === null)
    ) {
      const uids = Object.keys(validNodeTree);
      dispatch(expandFNNode(uids.slice(0, 50)));
      removeRunningActions(["processor-validNodeTree"], false);
    } else if (updateOpt.parse === null && updateOpt.from === "code") {
      const _focusedItem = newFocusedNodeUid;
      const _expandedItems = expandedItems.filter((uid) => {
        return (
          validNodeTree[uid] !== undefined &&
          validNodeTree[uid].isEntity === false
        );
      });
      const _selectedItems = selectedItems.filter((uid) => {
        return validNodeTree[uid] !== undefined;
      });
      dispatch(clearFNState());
      dispatch(focusFNNode(_focusedItem));
      dispatch(expandFNNode([..._expandedItems]));
      dispatch(selectFNNode([..._selectedItems, _focusedItem]));
      removeRunningActions(["processor-validNodeTree"], false);
    } else if (updateOpt.parse === null && updateOpt.from === "node") {
      removeRunningActions(["processor-validNodeTree"], false);
    } else {
      removeRunningActions(["processor-validNodeTree"], false);
    }
  }, [validNodeTree]);
};
