import { useContext } from "react";

import { ParsableFileTypes } from "@_constants/main";
import { TFileHandlerCollection, TFileNodeData } from "@_node/file";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";

export const processHandlerObj = (handlerObj:{[key: string]: any}) => {
	const { ffTree } = useContext(MainContext);
	const treeViewData: TNodeTreeData = {};
	const ffHandlerObj: TFileHandlerCollection = {};
	let _deletedUids: TNodeUid[] = [];
  
	// sort by ASC directory/file
	Object.keys(handlerObj).map((uid:string) => {
	  const handler = handlerObj[uid];
	  handler.children = handler.children.sort((a: string, b: string) => {
		return handlerObj[a].kind === "file" &&
		  handlerObj[b].kind === "directory"
		  ? 1
		  : handlerObj[a].kind === "directory" &&
			handlerObj[b].kind === "file"
		  ? -1
		  : handlerObj[a].name > handlerObj[b].name
		  ? 1
		  : -1;
	  });
	});
  
	// set ff-tree, ff-handlers
	Object.keys(handlerObj).map((uid) => {
	  const {
		parentUid,
		children,
		path,
		kind,
		name,
		ext,
		content,
		handler,
	  } = handlerObj[uid];
	  const type = ParsableFileTypes[ext || ""]
		? ext?.slice(1)
		: "unknown";
	  treeViewData[uid] = {
		uid,
		parentUid: parentUid,
		name: name,
		isEntity: kind === "file",
		children: [...children],
		data: {
		  valid: true,
		  path: path,
		  kind: kind,
		  name: name,
		  ext: ext,
		  type,
		  orgContent:
			type !== "unknown"
			  ? ffTree[uid]
				? (ffTree[uid].data as TFileNodeData).orgContent
				: content?.toString()
			  : "",
		  content:
			type !== "unknown"
			  ? ffTree[uid]
				? (ffTree[uid].data as TFileNodeData).content
				: content?.toString()
			  : "",
		  changed: ffTree[uid]
			? (ffTree[uid].data as TFileNodeData).changed
			: false,
		} as TFileNodeData,
	  } as TNode;
  
	  ffHandlerObj[uid] = handler;
	});
  
	return { treeViewData, ffHandlerObj, _deletedUids };
  }
  