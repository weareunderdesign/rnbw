import { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";
import { StageNodeIdAttr } from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { setHoveredNodeUid } from "@_redux/main/nodeTree";
import { setSelectedNodeUids } from "@_redux/main/nodeTree/event";
import {
  editHtmlContent,
  getValidElementWithUid,
  selectAllText,
} from "../helpers";
import { THtmlNodeData } from "@_node/node";
import { setActivePanel } from "@_redux/main/processor";
import { MainContext } from "@_redux/main";
import { LogAllow } from "@_constants/global";
import { ShortDelay } from "@_constants/main";
import { debounce } from "lodash";

interface IUseMouseEventsProps {
  iframeRefRef: React.MutableRefObject<HTMLIFrameElement | null>;
  nodeTreeRef: React.MutableRefObject<TNodeTreeData>;
  focusedItemRef: React.MutableRefObject<TNodeUid>;
  selectedItemsRef: React.MutableRefObject<TNodeUid[]>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
  linkTagUidRef: React.MutableRefObject<TNodeUid>;
}

export const useMouseEvents = ({
  iframeRefRef,
  nodeTreeRef,
  focusedItemRef,
  selectedItemsRef,
  contentEditableUidRef,
  isEditingRef,
  linkTagUidRef,
}: IUseMouseEventsProps) => {
  const dispatch = useDispatch();
  const { monacoEditorRef, setIsContentProgrammaticallyChanged } =
    useContext(MainContext);

  // hoveredNodeUid
  const onMouseEnter = useCallback((e: MouseEvent) => {}, []);
  const onMouseMove = useCallback((e: MouseEvent) => {
    const { uid } = getValidElementWithUid(e.target as HTMLElement);
    uid && dispatch(setHoveredNodeUid(uid));
  }, []);
  const onMouseLeave = (e: MouseEvent) => {
    dispatch(setHoveredNodeUid(""));
  };

  // click, dblclick handlers
  const onClick = useCallback((e: MouseEvent) => {
    dispatch(setActivePanel("stage"));

    const { uid, element } = getValidElementWithUid(e.target as HTMLElement);
    if (uid) {
      // update selectedNodeUids
      (() => {
        const uids = e.shiftKey
          ? getValidNodeUids(
              nodeTreeRef.current,
              Array(...new Set([...selectedItemsRef.current, uid])),
            )
          : [uid];

        // check if it's a new state
        let same = false;
        if (selectedItemsRef.current.length === uids.length) {
          same = true;
          for (
            let index = 0, len = selectedItemsRef.current.length;
            index < len;
            ++index
          ) {
            if (selectedItemsRef.current[index] !== uids[index]) {
              same = false;
              break;
            }
          }
        }

        !same && dispatch(setSelectedNodeUids(uids));
      })();

      // content-editable operation
      if (
        contentEditableUidRef.current &&
        contentEditableUidRef.current !== uid &&
        iframeRefRef.current
      ) {
        isEditingRef.current = false;
        const contentEditableUid = contentEditableUidRef.current;
        contentEditableUidRef.current = "";

        const codeViewInstance = monacoEditorRef.current;
        const codeViewInstanceModel = codeViewInstance?.getModel();
        if (!codeViewInstance || !codeViewInstanceModel) {
          LogAllow &&
            console.error(
              `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
            );
          return;
        }

        editHtmlContent({
          dispatch,
          iframeRef: iframeRefRef.current,
          nodeTree: nodeTreeRef.current,
          contentEditableUid,
          codeViewInstanceModel,
          setIsContentProgrammaticallyChanged,
        });
      }
    }
  }, []);

  const debouncedSelectAllText = useCallback(
    debounce(selectAllText, ShortDelay),
    [],
  );
  const onDblClick = useCallback((e: MouseEvent) => {
    const ele = e.target as HTMLElement;
    const uid: TNodeUid | null = ele.getAttribute(StageNodeIdAttr);

    if (!uid) {
      // when dbl-click on a web component
      /* const { uid: validUid, element: validElement } = getValidElementWithUid(
        e.target as HTMLElement,
      ); */
      isEditingRef.current = false;
    } else {
      const node = nodeTreeRef.current[uid];
      const nodeData = node.data as THtmlNodeData;
      if (["html", "head", "body", "img", "div"].includes(nodeData.name))
        return;

      const { startTag, endTag } = nodeData.sourceCodeLocation;
      if (startTag && endTag) {
        isEditingRef.current = true;
        contentEditableUidRef.current = uid;
        ele.setAttribute("contenteditable", "true");
        ele.focus();
        debouncedSelectAllText(iframeRefRef.current, ele);
      }
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
