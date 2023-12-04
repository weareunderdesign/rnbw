import { useCallback, useContext } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { MainContext } from "@_redux/main";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { getCommandKey } from "@_services/global";
import { TCmdkKeyMap } from "@_types/main";
import { useAppState } from "@_redux/useAppState";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { editHtmlContent } from "../helpers";

interface IUseCmdkProps {
  iframeRefRef: React.MutableRefObject<HTMLIFrameElement | null>;
  nodeTreeRef: React.MutableRefObject<TNodeTreeData>;
  contentEditableUidRef: React.MutableRefObject<TNodeUid>;
  isEditingRef: React.MutableRefObject<boolean>;
}

export const useCmdk = ({
  iframeRefRef,
  nodeTreeRef,
  contentEditableUidRef,
  isEditingRef,
}: IUseCmdkProps) => {
  const dispatch = useDispatch();
  const { nodeTree, osType } = useAppState();
  const {
    cmdkReferenceData,
    monacoEditorRef,
    setIsContentProgrammaticallyChanged,
  } = useContext(MainContext);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // for content-editing
      if (isEditingRef.current) {
        if (e.code === "Escape" && iframeRefRef.current) {
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
            return;
          }

          editHtmlContent({
            iframeRef: iframeRefRef.current,
            nodeTree: nodeTreeRef.current,
            contentEditableUid,
            codeViewInstanceModel,
            setIsContentProgrammaticallyChanged,
          });
        }
        return;
      }

      // cmdk obj for the current command
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
      if (action === null) return;

      LogAllow && console.log("action to be run by cmdk: ", action);

      // prevent chrome default short keys
      if (
        action === "Save" ||
        action === "Download" ||
        action === "Duplicate" ||
        action === "Group"
      ) {
        e.preventDefault();
      }

      dispatch(setCurrentCommand({ action }));
    },
    [cmdkReferenceData, nodeTree, osType],
  );

  return { onKeyDown };
};
