import { useCallback } from "react";

import { useDispatch } from "react-redux";

import { StageNodeIdAttr, TFileNodeData } from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { TNodeUid } from "@_node/types";
import { selectFileTreeNodes, setCurrentFileUid } from "@_redux/main/fileTree";
import { setHoveredNodeUid } from "@_redux/main/nodeTree";
import {
  setCurrentFileContent,
  setSelectedNodeUids,
} from "@_redux/main/nodeTree/event";
import { setNavigatorDropdownType } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

import { getValidElementWithUid, selectAllText } from "../helpers";
import { THtmlNodeData } from "@_node/node";

export interface IUseMouseEventsProps {
  contentRef: HTMLIFrameElement | null;
  focusedItemRef: React.MutableRefObject<TNodeUid>;
  selectedItemsRef: React.MutableRefObject<TNodeUid[]>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
  linkTagUidRef: React.MutableRefObject<TNodeUid>;
}

export const useMouseEvents = ({
  contentRef,
  focusedItemRef,
  selectedItemsRef,
  contentEditableUidRef,
  isEditingRef,
  linkTagUidRef,
}: IUseMouseEventsProps) => {
  const dispatch = useDispatch();
  const {
    navigatorDropdownType,

    fileTree,
    currentFileUid,
    prevRenderableFileUid,

    nodeTree,
    nSelectedItems: selectedItems,
  } = useAppState();

  const onMouseEnter = useCallback((e: MouseEvent) => {}, []);
  const onMouseMove = useCallback((e: MouseEvent) => {
    const uid = getValidElementWithUid(e.target as HTMLElement);
    uid && dispatch(setHoveredNodeUid(uid));
  }, []);
  const onMouseLeave = (e: MouseEvent) => {
    dispatch(setHoveredNodeUid(""));
  };

  const onClick = useCallback(
    (e: MouseEvent) => {
      const uid = getValidElementWithUid(e.target as HTMLElement);
      if (uid) {
        if (e.shiftKey) {
          const validUids = getValidNodeUids(
            nodeTree,
            Array(...new Set(...selectedItems, uid)),
          );
          dispatch(setSelectedNodeUids(validUids));
        } else {
          dispatch(setSelectedNodeUids([uid]));
        }
      }

      // update file - WIP
      if (currentFileUid !== prevRenderableFileUid) {
        const file = fileTree[prevRenderableFileUid];
        const fileData = file.data as TFileNodeData;
        dispatch(setCurrentFileUid(prevRenderableFileUid));
        dispatch(setCurrentFileContent(fileData.content));
        dispatch(selectFileTreeNodes([prevRenderableFileUid]));
        // dispatch({ type: NodeTree_Event_ClearActionType });
      }
      navigatorDropdownType !== null &&
        dispatch(setNavigatorDropdownType(null));
    },
    [
      nodeTree,
      selectedItems,
      navigatorDropdownType,
      fileTree,
      currentFileUid,
      prevRenderableFileUid,
    ],
  );
  const onDblClick = useCallback(
    (e: MouseEvent) => {
      const ele = e.target as HTMLElement;
      const uid: TNodeUid | null = ele.getAttribute(StageNodeIdAttr);

      if (!uid) {
        isEditingRef.current = false;
      } else {
        const node = nodeTree[uid];
        const nodeData = node.data as THtmlNodeData;
        if (["html", "head", "body", "img", "div"].includes(nodeData.name))
          return;

        isEditingRef.current = true;
        contentEditableUidRef.current = uid;
        ele.setAttribute("contenteditable", "true");
        ele.focus();
        selectAllText(contentRef, ele);
      }
    },
    [nodeTree],
  );

  return {
    onMouseLeave,
    onMouseMove,
    onMouseEnter,

    onClick,
    onDblClick,
  };
};
