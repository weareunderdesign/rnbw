import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { StageNodeIdAttr } from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import {
  setAppendExpandedNodeTreeNodes,
  setExpandedNodeTreeNodes,
  setHoveredNodeUid,
} from "@_redux/main/nodeTree";
import { setSelectedNodeUids } from "@_redux/main/nodeTree/event";
import { getValidElementWithUid, selectAllText } from "../helpers";
import { THtmlNodeData } from "@_node/node";
import { setActivePanel } from "@_redux/main/processor";
import { getExpandedItems } from "@_components/main/actionsPanel/navigatorPanel/helpers";

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

  const onClick = useCallback(
    (e: MouseEvent) => {
      dispatch(setActivePanel("stage"));

      const uid = getValidElementWithUid(e.target as HTMLElement);
      if (uid) {
        let uids = [uid];
        if (e.shiftKey) {
          const validUids = getValidNodeUids(
            nodeTreeRef.current,
            Array(...new Set([...selectedItemsRef.current, uid])),
          );
          uids = validUids;
        }
        dispatch(setSelectedNodeUids(uids));
        const expandedItems = getExpandedItems(nodeTreeRef.current, uids);
        dispatch(setAppendExpandedNodeTreeNodes(expandedItems));
      }

      if (contentEditableUidRef.current && contentRef) {
        const _document = contentRef.contentWindow?.document;
        const ele = _document?.querySelector(
          `[${StageNodeIdAttr}="${contentEditableUidRef.current}"]`,
        ) as HTMLElement;
        ele && ele.setAttribute("contenteditable", "false");
        contentEditableUidRef.current = "";

        //TODO: complete the functionality to update the code from the stage
        // const editableNode = nodeTreeRef.current[contentEditableUidRef.current];
        // if (!editableNode || !editableNode.data.sourceCodeLocation) return;

        // const codeViewInstance = monacoEditorRef.current;
        // const codeViewInstanceModel = codeViewInstance?.getModel();
        // if (!codeViewInstance || !codeViewInstanceModel) {
        //   LogAllow &&
        //     console.error(
        //       `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
        //     );
        //   return;
        // }

        // setIsContentProgrammaticallyChanged(true);
      }
    },
    [contentRef],
  );
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
