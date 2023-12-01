import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { StageNodeIdAttr } from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { setHoveredNodeUid } from "@_redux/main/nodeTree";
import { setSelectedNodeUids } from "@_redux/main/nodeTree/event";
import { getValidElementWithUid, selectAllText } from "../helpers";
import { THtmlNodeData } from "@_node/node";
import { setActivePanel } from "@_redux/main/processor";

interface IUseMouseEventsProps {
  contentRef: HTMLIFrameElement | null;
  nodeTreeRef: React.MutableRefObject<TNodeTreeData>;
  focusedItemRef: React.MutableRefObject<TNodeUid>;
  selectedItemsRef: React.MutableRefObject<TNodeUid[]>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
  linkTagUidRef: React.MutableRefObject<TNodeUid>;
}

export const useMouseEvents = ({
  contentRef,
  nodeTreeRef,
  focusedItemRef,
  selectedItemsRef,
  contentEditableUidRef,
  isEditingRef,
  linkTagUidRef,
}: IUseMouseEventsProps) => {
  const dispatch = useDispatch();

  const onMouseEnter = useCallback((e: MouseEvent) => {}, []);
  const onMouseMove = useCallback((e: MouseEvent) => {
    const uid = getValidElementWithUid(e.target as HTMLElement);
    uid && dispatch(setHoveredNodeUid(uid));
  }, []);
  const onMouseLeave = (e: MouseEvent) => {
    dispatch(setHoveredNodeUid(""));
  };

  const onClick = useCallback((e: MouseEvent) => {
    dispatch(setActivePanel("stage"));

    const uid = getValidElementWithUid(e.target as HTMLElement);
    if (uid) {
      if (e.shiftKey) {
        const validUids = getValidNodeUids(
          nodeTreeRef.current,
          Array(...new Set([...selectedItemsRef.current, uid])),
        );
        dispatch(setSelectedNodeUids(validUids));
      } else {
        dispatch(setSelectedNodeUids([uid]));
      }
    }
  }, []);
  const onDblClick = useCallback((e: MouseEvent) => {
    dispatch(setActivePanel("stage"));

    const ele = e.target as HTMLElement;
    const uid: TNodeUid | null = ele.getAttribute(StageNodeIdAttr);

    if (!uid) {
      isEditingRef.current = false;
    } else {
      const node = nodeTreeRef.current[uid];
      const nodeData = node.data as THtmlNodeData;
      if (["html", "head", "body", "img", "div"].includes(nodeData.name))
        return;

      isEditingRef.current = true;
      contentEditableUidRef.current = uid;
      ele.setAttribute("contenteditable", "true");
      ele.focus();
      selectAllText(contentRef, ele);
    }
  }, []);

  return {
    onMouseLeave,
    onMouseMove,
    onMouseEnter,

    onClick,
    onDblClick,
  };
};
