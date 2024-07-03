import { useCallback, useContext } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@src/indexConstants";
import { MainContext } from "@_redux/main";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { getCommandKey } from "@_services/global";
import { TCmdkKeyMap } from "@_types/main";

import { getBodyChild, getValidElementWithUid } from "../helpers";
import { setShowActionsPanel, setShowCodeView } from "@_redux/main/processor";
import { eventListenersStatesRefType } from "../IFrame";
import { setHoveredNodeUid } from "@_redux/main/nodeTree";
import useRnbw from "@_services/useRnbw";

export const useCmdk = () => {
  const dispatch = useDispatch();
  const rnbw = useRnbw();
  const { monacoEditorRef } = useContext(MainContext);

  const handlePanelsToggle = useCallback(
    (
      event: KeyboardEvent,
      eventListenerRef: React.MutableRefObject<eventListenersStatesRefType>,
    ) => {
      const { isEditingRef, showActionsPanel, showCodeView, activePanel } =
        eventListenerRef.current;
      if (isEditingRef.current) return;
      if (event.code === "Escape") {
        if (activePanel === "file") {
          if (
            event.target instanceof HTMLElement &&
            event.target.id === "FileTreeView-RenameInput"
          )
            return;
        }
        if (!showActionsPanel && !showCodeView) {
          dispatch(setShowActionsPanel(true));
          dispatch(setShowCodeView(true));
        } else {
          dispatch(setShowActionsPanel(false));
          dispatch(setShowCodeView(false));
        }
      }
    },
    [],
  );
  const onKeyDown = useCallback(
    async (
      e: KeyboardEvent,
      eventListenerRef: React.MutableRefObject<eventListenersStatesRefType>,
    ) => {
      const {
        isEditingRef,
        osType,
        cmdkReferenceData,
        iframeRefRef,
        contentEditableUidRef,
        hoveredTargetRef,
        hoveredNodeUid,
      } = eventListenerRef.current;
      // cmdk obj for the current command

      if (getCommandKey(e, osType)) {
        iframeRefRef.current?.focus();
        const { uid } = getValidElementWithUid(
          hoveredTargetRef.current as HTMLElement,
        );
        if (!uid) return;
        if (hoveredNodeUid !== uid) dispatch(setHoveredNodeUid(uid));
      }
      const cmdk: TCmdkKeyMap = {
        cmd: getCommandKey(e, osType),
        shift: e.shiftKey,
        alt: e.altKey,
        key: e.code,
        click: false,
      };
      // detect action
      let action: string | null = null;
      for (const actionName in cmdkReferenceData) {
        const _cmdkArray = cmdkReferenceData[actionName][
          "Keyboard Shortcut"
        ] as TCmdkKeyMap[];

        let matched = false;

        for (const keyObj of _cmdkArray) {
          const key =
            keyObj.key.length === 0
              ? ""
              : keyObj.key === "\\"
                ? "Backslash"
                : (keyObj.key.length === 1 ? "Key" : "") +
                  keyObj.key[0].toUpperCase() +
                  keyObj.key.slice(1);

          if (
            cmdk.cmd === keyObj.cmd &&
            cmdk.shift === keyObj.shift &&
            cmdk.alt === keyObj.alt &&
            cmdk.key === key
          ) {
            action = actionName;
            matched = true;
            break; // Match found, exit the inner loop
          }
        }

        if (matched) {
          break; // Match found, exit the outer loop
        }
      }
      if (isEditingRef.current) {
        // for content-editing
        if (
          (e.code === "Escape" || action === "Save") &&
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
                `Monaco Editor ${
                  !codeViewInstance ? "" : "Model"
                } is undefined`,
              );
          } else {
            action === "Save" &&
              LogAllow &&
              console.log("action to be run by cmdk: ", action);

            await rnbw.elements.updateEditableElement({
              eventListenerRef,
              contentEditableUid,
              eventSource: "esc",
            });
            action === "Save" &&
              dispatch(setCurrentCommand({ action: "SaveForce" }));
          }
        }
      } else {
        if (action) {
          LogAllow && console.log("action to be run by cmdk: ", action);
          dispatch(setCurrentCommand({ action }));
        }
      }

      !isEditingRef.current && action && e.preventDefault();
    },
    [],
  );

  const onKeyUp = useCallback(
    (
      e: KeyboardEvent,
      eventListenerRef: React.MutableRefObject<eventListenersStatesRefType>,
    ) => {
      const {
        osType,
        hoveredItemRef,
        selectedItemsRef,
        nodeTreeRef,
        hoveredNodeUid,
      } = eventListenerRef.current;
      if (
        !hoveredItemRef.current ||
        selectedItemsRef.current.includes(hoveredItemRef.current)
      )
        return;

      if (
        ((osType === "Windows" || osType === "Linux") && e.key == "Control") ||
        (osType === "Mac" && e.key == "Meta")
      ) {
        const targetUid = getBodyChild({
          uids: [hoveredItemRef.current],
          nodeTree: nodeTreeRef.current,
        });
        if (targetUid[0] !== hoveredNodeUid)
          dispatch(setHoveredNodeUid(targetUid[0]));
      }
    },
    [],
  );
  return {
    onKeyDown,
    onKeyUp,
    handlePanelsToggle,
  };
};
