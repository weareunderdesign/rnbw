import { useCallback, useContext } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { TNode } from "@_node/types";
import { AppState } from "@_redux/_root";
import { MainContext } from "@_redux/main";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { getCommandKey } from "@_services/global";
import { TCmdkKeyMap } from "@_types/main";
import { useAppState } from "@_redux/useAppState";

export interface IUseCmdkProps {
  contentEditableUidRef: React.MutableRefObject<string>;
  mostRecentSelectedNode: React.MutableRefObject<TNode | undefined>;
}

export const useCmdk = ({
  contentEditableUidRef,
  mostRecentSelectedNode,
}: IUseCmdkProps) => {
  const dispatch = useDispatch();
  const { nodeTree, osType } = useAppState();
  const {
    // references
    cmdkReferenceData,
  } = useContext(MainContext);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      //We are trying to find a way to get node id with this event
      if (contentEditableUidRef.current !== "") {
        let isSaving = e.key === "s" && (e.ctrlKey || e.metaKey);
        if (!isSaving) {
          return;
        }
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
        action === "Duplicate"
      ) {
        e.preventDefault();
      }

      dispatch(setCurrentCommand({ action }));
    },
    [cmdkReferenceData, nodeTree],
  );

  return { onKeyDown };
};
