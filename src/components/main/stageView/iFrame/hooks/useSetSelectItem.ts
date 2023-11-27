import { useCallback, useContext } from "react";

import { useDispatch } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { StageNodeIdAttr } from "@_node/file/handlers/constants";
import { TNode, TNodeUid } from "@_node/types";
import { AppState } from "@_redux/_root";
import { MainContext } from "@_redux/main";
import {
  expandNodeTreeNodes,
  focusNodeTreeNode,
  selectNodeTreeNodes,
} from "@_redux/main/nodeTree";
import { useAppState } from "@_redux/useAppState";

export interface IUseSetSelectItemProps {
  mostRecentSelectedNode: React.MutableRefObject<TNode | undefined>;
  focusedItemRef: React.MutableRefObject<string>;
  contentRef: HTMLIFrameElement | null;
}

export const useSetSelectItem = ({
  mostRecentSelectedNode,
  focusedItemRef,
  contentRef,
}: IUseSetSelectItemProps) => {
  const dispatch = useDispatch();
  const {
    // global action
    addRunningActions,
    removeRunningActions,

    // code view
    setCodeViewOffsetTop,
  } = useContext(MainContext);

  const { nodeTree } = useAppState();

  const setFocusedSelectedItems = useCallback(
    (uid: TNodeUid, _selectedItems?: TNodeUid[]) => {
      addRunningActions(["stageView-focus"]);

      // expand path to the uid
      const _expandedItems: TNodeUid[] = [];
      let node = nodeTree[uid];
      if (!node) return;
      mostRecentSelectedNode.current = node;
      while (node.uid !== RootNodeUid) {
        _expandedItems.push(node.uid);
        node = nodeTree[node.parentUid as TNodeUid];
      }
      _expandedItems.shift();
      dispatch(expandNodeTreeNodes(_expandedItems));

      dispatch(focusNodeTreeNode(uid));
      _selectedItems
        ? dispatch(selectNodeTreeNodes(_selectedItems))
        : dispatch(selectNodeTreeNodes([uid]));

      focusedItemRef.current = uid;

      const newFocusedElement =
        contentRef?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${uid}"]`,
        );
      const elementRect = (
        newFocusedElement as HTMLElement
      )?.getBoundingClientRect();
      setTimeout(
        () =>
          newFocusedElement?.scrollIntoView({
            block: "nearest",
            inline: "start",
            behavior: "smooth",
          }),
        50,
      );
      if (elementRect) {
        if (elementRect.y < 0) {
          setCodeViewOffsetTop("calc(66.66vh - 12px)");
        } else {
          const innerHeight =
            contentRef?.contentWindow?.document.documentElement.clientHeight;
          const elePosition = elementRect.y + elementRect.height / 2;
          if (innerHeight) {
            if (elementRect.height < innerHeight / 2) {
              if ((elePosition / innerHeight) * 100 > 66) {
                setCodeViewOffsetTop("12px");
              }
              if ((elePosition / innerHeight) * 100 < 33) {
                setCodeViewOffsetTop("calc(66.66vh - 12px)");
              }
            }
          }
        }
      }
      removeRunningActions(["stageView-focus"]);
    },
    [addRunningActions, removeRunningActions, nodeTree, contentRef],
  );
  return {
    setFocusedSelectedItems,
  };
};
