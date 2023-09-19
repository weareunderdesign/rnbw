import { useContext } from "react";

import { NodeInAppAttribName } from "@_constants/main";
import { THtmlNodeData } from "@_node/html";
import { TNode, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";

export const cloneAndInsertNode = (
	node: TNode,
	addedUidMap: Map<TNodeUid, TNodeUid>,
	targetElement:any,
	refElement:any
) => {

	const {
	  clipboardData,
	} = useContext(MainContext);

	let _ele: HTMLElement;
	const ele = (clipboardData.prevNodeTree[node.uid].data as THtmlNodeData).htmlInApp;
	const div = document.createElement("div");
	div.innerHTML = ele.trim();
	_ele = div.firstChild as HTMLElement;

	const resetNodeUid = (element: HTMLElement, uid: TNodeUid) => {
	  const newUid = addedUidMap.get(uid);
	  if (newUid) {
		element.setAttribute(NodeInAppAttribName, newUid);
	  }
	};

	resetNodeUid(_ele, node.uid);

	const resetDescendantUids = (element: HTMLElement) => {
	  const childElementList = element.querySelectorAll("*");
	  childElementList.forEach((childElement) => {
		const childUid = childElement.getAttribute(NodeInAppAttribName);
		if (childUid) {
		  const newChildUid = addedUidMap.get(childUid);
		  if (newChildUid) {
			childElement.setAttribute(NodeInAppAttribName, newChildUid);
		  }
		}
	  });
	};

	resetDescendantUids(_ele);

	targetElement?.insertBefore(_ele, refElement || null);
  };