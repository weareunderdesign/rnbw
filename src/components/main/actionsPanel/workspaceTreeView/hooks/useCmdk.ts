import { useCallback, useContext } from "react";
import { useSelector } from "react-redux";

import { MainContext, ffSelector, navigatorSelector } from "@_redux/main";
import { useNodeActionsHandler } from "./useNodeActionsHandler";
import { useInvalidNodes } from "./useInvalidNodes";
import { AddFileActionPrefix } from "@_constants/main";
import { TFileNodeType } from "@_types/main";

export const useCmdk = (openFileUid: React.MutableRefObject<string>) =>{

  const { file } = useSelector(navigatorSelector);
  const {
    focusedItem,
    selectedItems,
  } = useSelector(ffSelector);

  const {
    clipboardData,
    setClipboardData,
    ffTree,
    nodeTree,
  } = useContext(MainContext);

  const {
	createTmpFFNode,
	cb_deleteNode,
	cb_moveNode,
	cb_duplicateNode,
  } = useNodeActionsHandler(openFileUid)

  const { invalidNodes} = useInvalidNodes()


	const onDelete = useCallback(() => {
		cb_deleteNode();
	  }, [cb_deleteNode]);
	  const onCut = useCallback(() => {
		setClipboardData({
		  panel: "file",
		  type: "cut",
		  uids: selectedItems,
		  fileType: ffTree[file.uid].data.type,
		  data: [],
		  fileUid: file.uid,
		  prevNodeTree: nodeTree,
		});
	  }, [selectedItems, ffTree[file.uid], nodeTree]);
	  const onCopy = useCallback(() => {
		setClipboardData({
		  panel: "file",
		  type: "copy",
		  uids: selectedItems,
		  fileType: ffTree[file.uid].data.type,
		  data: [],
		  fileUid: file.uid,
		  prevNodeTree: nodeTree,
		});
	  }, [selectedItems, ffTree[file.uid], nodeTree]);
	  const onPaste = useCallback(() => {
		if (clipboardData.panel !== "file") return;
	
		// validate
		if (invalidNodes[focusedItem]) return;
		const uids = clipboardData.uids.filter((uid) => !invalidNodes[uid]);
		if (uids.length === 0) return;
	
		if (clipboardData.type === "cut") {
		  setClipboardData({
			panel: "file",
			type: "cut",
			uids: [],
			fileType: "html",
			data: [],
			fileUid: "",
			prevNodeTree: {},
		  });
		  cb_moveNode(uids, focusedItem);
		} else if (clipboardData.type === "copy") {
		  cb_moveNode(uids, focusedItem, true);
		}
	  }, [clipboardData, invalidNodes, focusedItem, cb_moveNode]);
	  const onDuplicate = useCallback(() => {
		cb_duplicateNode();
	  }, [cb_duplicateNode]);

	  const onAddNode = useCallback(
		(actionName: string) => {
		  const nodeType = actionName.slice(AddFileActionPrefix.length + 1);
		  createTmpFFNode(
			nodeType === "folder" ? "*folder" : (nodeType as TFileNodeType),
		  );
		},
		[createTmpFFNode],
	  );

	  return{
		onDelete,
		onCut,
		onCopy,
		onPaste,
		onDuplicate,
		onAddNode
	  }
}