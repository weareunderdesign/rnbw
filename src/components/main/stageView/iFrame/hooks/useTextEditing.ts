import { useCallback, useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { NodeInAppAttribName } from "@_constants/main";
import { TNode, TNodeUid } from "@_node/types";
import { 
	MainContext, 
	ffSelector, 
	fnSelector, 
	focusFNNode 
} from "@_redux/main";
import { getCommandKey } from "@_services/global";
import { TCmdkKeyMap } from "@_types/main";
import { useSetSelectItem } from "./useSetSelectItem";
import { 
	handleAnchorTagDoubleClick,
	handleEditableElementDoubleClick, 
	handleWebComponentDblClick 
} from "../helpers";

export interface IUseTextEditingProps{
	contentEditableUidRef: React.MutableRefObject<string>,
	contentRef: HTMLIFrameElement | null,
	isEditing: React.MutableRefObject<boolean>,
	mostRecentSelectedNode: React.MutableRefObject<TNode | undefined>,
	focusedItemRef: React.MutableRefObject<string>,
	dblClickTimestamp: React.MutableRefObject<number>,
	externalDblclick: React.MutableRefObject<boolean>
}

export const useTextEditing = (
	{
		contentEditableUidRef,
		contentRef,
		isEditing,
		mostRecentSelectedNode,
		focusedItemRef,
		dblClickTimestamp,
		externalDblclick
	}:IUseTextEditingProps) =>{

	const dispatch = useDispatch();
	const { focusedItem } = useSelector(fnSelector);
	const { expandedItemsObj } = useSelector(ffSelector);
	const {
	  // global action
	  addRunningActions,
	  // node actions
	  setNavigatorDropDownType,
	  // file tree view
	  ffTree,
	  setInitialFileToOpen,
	  // node tree view
	  validNodeTree,
	  // code view
	  setCodeChanges,
	  // processor
	  setUpdateOpt,
	  // other
	  osType,
	  // close all panel
	  closeAllPanel,
	} = useContext(MainContext);

	  const [contentEditableAttr, setContentEditableAttr] = useState<string | null>(
		null,
	  );
	  const [outerHtml, setOuterHtml] = useState("");

	  const { setFocusedSelectedItems } = useSetSelectItem(
		{
		  mostRecentSelectedNode, 
		  focusedItemRef, 
		  contentRef
		})
	
	  const onTextEdit = useCallback(
		(node: TNode, _outerHtml: string) => {
		  // replace enter to br
		  while (true) {
			_outerHtml = _outerHtml.replace("<div><br></div>", "<br>");
			if (_outerHtml.search("<div><br></div>") === -1) break;
		  }
	
		  setCodeChanges([{ uid: node.uid, content: _outerHtml }]);
		  addRunningActions(["processor-updateOpt"]);
		  setUpdateOpt({ parse: true, from: "stage" });
		  // expand path to the uid
	
		  setTimeout(() => {
			dispatch(focusFNNode(node.uid));
		  }, 10);
		},
		[outerHtml],
	  );
	
	  const beforeTextEdit = useCallback(() => {
		let node = validNodeTree[contentEditableUidRef.current];
		if (!node) return;
		let ele = contentRef?.contentWindow?.document?.querySelector(
		  `[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`,
		);
		// check if editing tags are <code> or <pre>
		let _parent = node.uid as TNodeUid;
		let notParsingFlag =
		  validNodeTree[node.uid].name === "code" ||
		  validNodeTree[node.uid].name === "pre"
			? true
			: false;
		while (_parent !== undefined && _parent !== null && _parent !== "ROOT") {
		  if (
			validNodeTree[_parent].name === "code" ||
			validNodeTree[_parent].name === "pre"
		  ) {
			notParsingFlag = true;
			break;
		  }
		  _parent = validNodeTree[_parent].parentUid as TNodeUid;
		}
		if (notParsingFlag) {
		  ele = contentRef?.contentWindow?.document?.querySelector(
			`[${NodeInAppAttribName}="${_parent}"]`,
		  );
		  node = validNodeTree[_parent];
		}
		if (!node) return;
	
		if (!ele) return;
		contentEditableUidRef.current = "";
		isEditing.current = false;
	
		contentEditableAttr
		  ? ele.setAttribute("contenteditable", contentEditableAttr)
		  : ele.removeAttribute("contenteditable");
		const cleanedUpCode = ele.outerHTML.replace(
		  /rnbwdev-rnbw-element-hover=""|rnbwdev-rnbw-element-select=""|contenteditable="true"|contenteditable="false"/g,
		  "",
		);
		onTextEdit(node, cleanedUpCode);
	  }, [focusedItem]);
	
	  const onCmdEnter = useCallback(
		(e: KeyboardEvent) => {
		  // cmdk obj for the current command
		  const cmdk: TCmdkKeyMap = {
			cmd: getCommandKey(e, osType),
			shift: e.shiftKey,
			alt: e.altKey,
			key: e.code,
			click: false,
		  };
	
		  if (e.key === "Escape") {
			//https://github.com/rnbwdev/rnbw/issues/240
			if (contentEditableUidRef.current !== "") {
			  const ele = contentRef?.contentWindow?.document?.querySelector(
				`[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`,
			  );
			  ele?.removeAttribute("contenteditable");
			  contentEditableUidRef.current = "";
			  return;
			}
			//
			closeAllPanel();
			return;
		  }
	
		  if (cmdk.cmd && cmdk.key === "KeyG") {
			e.preventDefault();
			e.stopPropagation();
			// return
		  }
	
		  if (cmdk.cmd && cmdk.key === "Enter") {
			const ele = contentRef?.contentWindow?.document?.querySelector(
			  `[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`,
			);
			if (!ele) return;
			(ele as HTMLElement).blur();
			setFocusedSelectedItems(focusedItem);
		  }
		},
		[focusedItem, validNodeTree, contentRef],
	  );
	
	  const onDblClick = useCallback(
		async (e: MouseEvent) => {
			const ele = e.target as HTMLElement;

			if (dblClickTimestamp.current !== 0 &&
			  e.timeStamp - dblClickTimestamp.current < 500) return;
			
			dblClickTimestamp.current = e.timeStamp;
			await handleAnchorTagDoubleClick(ele);
			await handleEditableElementDoubleClick(
			  ele,
			  contentEditableUidRef,
			  isEditing,
			  contentRef
			);
			await handleWebComponentDblClick(ele,externalDblclick);
			
		  },
		[validNodeTree, ffTree, expandedItemsObj, contentRef],
	  );

	return{
		beforeTextEdit,
		onCmdEnter,
		onDblClick
	}  
}