import { useCallback, useContext } from "react";
import { TNode, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { getCommandKey } from "@_services/global";
import { TCmdkKeyMap } from "@_types/main";
import { useSelector } from "react-redux";
import { AppState } from "@_redux/_root";
import { LogAllow } from "@_constants/global";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { useDispatch } from "react-redux";

export interface IUseCmdkProps {
  contentEditableUidRef: React.MutableRefObject<string>;
  mostRecentSelectedNode: React.MutableRefObject<TNode | undefined>;
}

export const useCmdk = ({
  contentEditableUidRef,
  mostRecentSelectedNode,
}: IUseCmdkProps) => {
  const {
    // references
    cmdkReferenceData,
  } = useContext(MainContext);
  const { nodeTree } = useSelector((state: AppState) => state.main.nodeTree);
  const { osType } = useSelector((state: AppState) => state.global);

  const dispatch = useDispatch();
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      //We are trying to fina a way to get node id with this event
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
        const _cmdk = cmdkReferenceData[actionName][
          "Keyboard Shortcut"
        ] as TCmdkKeyMap;

        const key =
          _cmdk.key.length === 0
            ? ""
            : _cmdk.key === "\\"
            ? "Backslash"
            : (_cmdk.key.length === 1 ? "Key" : "") +
              _cmdk.key[0].toUpperCase() +
              _cmdk.key.slice(1);
        if (
          cmdk.cmd === _cmdk.cmd &&
          cmdk.shift === _cmdk.shift &&
          cmdk.alt === _cmdk.alt &&
          cmdk.key === key
        ) {
          action = actionName;
          break;
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
