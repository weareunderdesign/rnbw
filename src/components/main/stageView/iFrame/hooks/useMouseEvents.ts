import { useCallback, useContext, useRef } from "react";

import { debounce } from "lodash";
import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { ShortDelay } from "@_constants/main";
import { StageNodeIdAttr } from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { THtmlNodeData } from "@_node/node";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { setHoveredNodeUid } from "@_redux/main/nodeTree";
import { setSelectedNodeUids } from "@_redux/main/nodeTree/event";
import { setActivePanel } from "@_redux/main/processor";

import {
  editHtmlContent,
  getValidElementWithUid,
  selectAllText,
} from "../helpers";
import {
  isWebComponentDblClicked,
  onWebComponentDblClick,
} from "@_pages/main/helper";
import { useAppState } from "@_redux/useAppState";

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
  selectedItemsRef,
  contentEditableUidRef,
  isEditingRef,
}: IUseMouseEventsProps) => {
  const dispatch = useDispatch();
  const { monacoEditorRef } = useContext(MainContext);
  const {
    fileTree,
    validNodeTree,
    fExpandedItemsObj: expandedItemsObj,
    formatCode,
    htmlReferenceData,
  } = useAppState();

  const mostRecentClickedNodeUidRef = useRef<TNodeUid>(""); //This is used because dbl clikc event was not able to receive the uid of the node that was clicked

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

    const { uid } = getValidElementWithUid(e.target as HTMLElement);
    if (uid) {
      mostRecentClickedNodeUidRef.current = uid;
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
          formatCode,
        });
      }
    }
  }, []);

  const debouncedSelectAllText = useCallback(
    debounce(selectAllText, ShortDelay),
    [],
  );
  const onDblClick = useCallback(
    (e: MouseEvent) => {
      const ele = e.target as HTMLElement;
      const uid: TNodeUid | null = ele.getAttribute(StageNodeIdAttr);

      if (!uid) {
        // when dbl-click on a web component
        isEditingRef.current = false;
        if (mostRecentClickedNodeUidRef.current) {
          // when dbl-click on a web component
          const node = nodeTreeRef.current[mostRecentClickedNodeUidRef.current];
          const nodeData = node.data as THtmlNodeData;
          if (
            isWebComponentDblClicked({
              htmlReferenceData,
              nodeData,
            })
          ) {
            onWebComponentDblClick({
              dispatch,
              expandedItemsObj,
              fileTree,
              validNodeTree,
              wcName: nodeData.nodeName,
            });
            return;
          }
        }
      } else {
        const node = nodeTreeRef.current[uid];
        const nodeData = node.data as THtmlNodeData;
        console.log("nodeData", mostRecentClickedNodeUidRef.current);

        if (["html", "head", "body", "img", "div"].includes(nodeData.name))
          return;

        const { startTag, endTag } = nodeData.sourceCodeLocation;
        if (startTag && endTag && contentEditableUidRef.current !== uid) {
          isEditingRef.current = true;
          contentEditableUidRef.current = uid;
          ele.setAttribute("contenteditable", "true");
          ele.focus();
          debouncedSelectAllText(iframeRefRef.current, ele);
        }
      }
    },
    [
      contentEditableUidRef,
      debouncedSelectAllText,
      expandedItemsObj,
      fileTree,
      htmlReferenceData,
      nodeTreeRef,
      validNodeTree,
      mostRecentClickedNodeUidRef.current,
    ],
  );

  return {
    onMouseLeave,
    onMouseMove,
    onMouseEnter,
    onClick,
    onDblClick,
  };
};
