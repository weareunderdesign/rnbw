import { useCallback, useContext, useRef } from "react";
import { useDispatch } from "react-redux";

import { LogAllow } from "@src/indexTSX";
import { ShortDelay } from "@src/indexTSX";
import { StageNodeIdAttr } from "@_node/file";
import { getValidNodeUids } from "@_node/helpers";
import { THtmlNodeData } from "@_node/node";
import { MainContext } from "@_redux/main";
import { setHoveredNodeUid } from "@_redux/main/nodeTree";
import { setSelectedNodeUids } from "@_redux/main/nodeTree/event";
import { setActivePanel } from "@_redux/main/processor";

import {
  areArraysEqual,
  getBodyChild,
  getValidElementWithUid,
  isChild,
  isSameParents,
  selectAllText,
} from "../helpers";
import {
  debounce,
  isWebComponentDblClicked,
  onWebComponentDblClick,
} from "@src/helper";

import { getCommandKey } from "@_services/index";
import { eventListenersStatesRefType } from "../IFrame";
import { TNodeUid } from "@_node/index";
import { useNavigate } from "react-router-dom";
import useRnbw from "@_services/useRnbw";

export const useMouseEvents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { monacoEditorRef } = useContext(MainContext);
  const rnbw = useRnbw();

  const mostRecentClickedNodeUidRef = useRef<TNodeUid>(""); //This is used because dbl clikc event was not able to receive the uid of the node that was clicked

  // hoveredNodeUid
  const onMouseEnter = useCallback(() => {}, []);
  const onMouseMove = useCallback(
    (
      e: MouseEvent,
      eventListenerRef: React.MutableRefObject<eventListenersStatesRefType>,
    ) => {
      const {
        nodeTreeRef,
        selectedItemsRef,
        contentEditableUidRef,
        iframeRefRef,
        osType,
        hoveredNodeUid,
      } = eventListenerRef.current;
      const { uid } = getValidElementWithUid(e.target as HTMLElement);
      if (!uid) return;
      if (getCommandKey(e, osType)) {
        if (hoveredNodeUid !== uid) dispatch(setHoveredNodeUid(uid));
        iframeRefRef.current?.focus();
      } else {
        const isSelectedChild = isChild({
          currentUid: uid,
          nodeTree: nodeTreeRef.current,
          selectedUid: selectedItemsRef.current[0],
        });

        const targetUids =
          isSelectedChild || uid == contentEditableUidRef.current
            ? [selectedItemsRef.current[0]]
            : getBodyChild({ uids: [uid], nodeTree: nodeTreeRef.current });

        if (targetUids[0] !== hoveredNodeUid) {
          dispatch(setHoveredNodeUid(targetUids[0]));
        }
      }
    },
    [],
  );
  const onMouseLeave = () => {
    dispatch(setHoveredNodeUid(""));
  };

  // click, dblclick handlers
  const onClick = useCallback(
    (
      e: MouseEvent,
      eventListenerRef: React.MutableRefObject<eventListenersStatesRefType>,
    ) => {
      const {
        nodeTreeRef,
        selectedItemsRef,
        contentEditableUidRef,
        iframeRefRef,
        isEditingRef,
        activePanel,
        osType,
      } = eventListenerRef.current;
      if (activePanel !== "stage") dispatch(setActivePanel("stage"));

      const { uid } = getValidElementWithUid(e.target as HTMLElement);
      if (!uid) return;
      mostRecentClickedNodeUidRef.current = uid;
      // update selectedNodeUids
      (() => {
        const updatedSelectedItems = selectedItemsRef.current.includes(uid)
          ? selectedItemsRef.current.filter((item) => item !== uid)
          : [...selectedItemsRef.current, uid];
        const uids = e.shiftKey
          ? getValidNodeUids(
              nodeTreeRef.current,
              Array.from(new Set(updatedSelectedItems)),
            )
          : [uid];

        let targetUids = uids;
        if (getCommandKey(e, osType)) {
          targetUids = uids;
        } else {
          const sameParents = isSameParents({
            currentUid: uid,
            nodeTree: nodeTreeRef.current,
            selectedUid: selectedItemsRef.current[0],
          });

          targetUids = sameParents
            ? [sameParents]
            : getBodyChild({ uids, nodeTree: nodeTreeRef.current });
        }

        // check if it's a new state
        const same = areArraysEqual(selectedItemsRef.current, targetUids);
        !same && dispatch(setSelectedNodeUids(targetUids));
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
        rnbw.elements.updateEditableElement({
          eventListenerRef,
          contentEditableUid,
          eventSource: "click",
        });
      }
    },
    [monacoEditorRef],
  );

  const debouncedSelectAllText = useCallback(
    debounce(selectAllText, ShortDelay),
    [],
  );
  const onDblClick = useCallback(
    (
      e: MouseEvent,
      eventListenerRef: React.MutableRefObject<eventListenersStatesRefType>,
    ) => {
      const {
        nodeTreeRef,
        selectedItemsRef,
        contentEditableUidRef,
        isEditingRef,
        iframeRefRef,
        fExpandedItemsObj,
        htmlReferenceData,
        fileTree,
        validNodeTree,
        hoveredNodeUid,
      } = eventListenerRef.current;

      const ele = e.target as HTMLElement;
      const uid: TNodeUid | null =
        ele.getAttribute(StageNodeIdAttr) ||
        mostRecentClickedNodeUidRef.current;

      const node = nodeTreeRef.current[uid];
      if (!node) return;
      const nodeData = node?.data as THtmlNodeData;

      // when dbl-click on a web component
      if (
        isWebComponentDblClicked({
          htmlReferenceData,
          nodeData,
        }) &&
        selectedItemsRef.current[0] === uid &&
        nodeData.nodeName !== "#text"
      ) {
        onWebComponentDblClick({
          dispatch,
          expandedItemsObj: fExpandedItemsObj,
          fileTree,
          validNodeTree,
          wcName: nodeData.nodeName,
          navigate,
        });
        return;
      }

      const targetUid = isChild({
        currentUid: uid,
        nodeTree: nodeTreeRef.current,
        selectedUid: selectedItemsRef.current[0],
      });

      const same = areArraysEqual(selectedItemsRef.current, [
        !targetUid ? uid : targetUid,
      ]);
      !same && dispatch(setSelectedNodeUids([!targetUid ? uid : targetUid]));
      if (hoveredNodeUid !== "") dispatch(setHoveredNodeUid(""));

      if (targetUid) return;
      if (!ele.getAttribute("rnbw-text-element")) return;

      const { startLine, endLine } = nodeData.sourceCodeLocation;
      if (startLine && endLine && contentEditableUidRef.current !== uid) {
        isEditingRef.current = true;
        contentEditableUidRef.current = uid;
        ele.setAttribute("contenteditable", "true");
        ele.focus();
        debouncedSelectAllText(iframeRefRef.current, ele);
      }
    },
    [debouncedSelectAllText, mostRecentClickedNodeUidRef.current],
  );
  const onMouseOver = useCallback(
    (
      e: MouseEvent,
      eventListenerRef: React.MutableRefObject<eventListenersStatesRefType>,
    ) => {
      const { hoveredTargetRef } = eventListenerRef.current;
      hoveredTargetRef.current = e.target;
    },
    [],
  );

  return {
    onMouseLeave,
    onMouseMove,
    onMouseEnter,
    onClick,
    onDblClick,
    onMouseOver,
  };
};
