import { useCallback, useContext } from "react";

import { LogAllow } from "@_constants/main";
import { TNode, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { getCommandKey } from "@_services/global";
import { TCmdkKeyMap } from "@_types/main";

export interface IUseCmdkProps{
	contentEditableUidRef: React.MutableRefObject<string>,
	mostRecentSelectedNode: React.MutableRefObject<TNode | undefined>
}

export const useCmdk = (
	{
		contentEditableUidRef,
		mostRecentSelectedNode
	}:IUseCmdkProps) =>{

	const {
		// node tree view
		nodeTree,
		// references
		cmdkReferenceData,
		// cmdk
		setCurrentCommand,
		// other
		osType,
	} = useContext(MainContext);
  
	const onKeyDown = useCallback(
		(e: KeyboardEvent) => {
		  //We are trying to fina a way to get node id with this event
		  if (contentEditableUidRef.current !== "") {
			let isSaving = e.key === "s" && (e.ctrlKey || e.metaKey);
			if (!isSaving) {
			  return;
			}
			type TTarget = HTMLElement & {
			  dataset: {
				rnbwdevRnbwNode: string;
			  };
			};
			const target: TTarget | null = e.target as TTarget;
			if (target && "dataset" in target) {
			  const uid = target.dataset.rnbwdevRnbwNode;
			  if (uid) {
				let uid = mostRecentSelectedNode.current?.uid as TNodeUid;
				let parentUid = mostRecentSelectedNode.current
				  ?.parentUid as TNodeUid;
			  }
	
			  //TODO: IN_PROGRESS
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
	
		  setCurrentCommand({ action });
		},
		[cmdkReferenceData, nodeTree],
	  );

	return {onKeyDown}
}