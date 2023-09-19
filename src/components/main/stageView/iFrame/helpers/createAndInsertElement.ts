import { RefObject, useContext } from "react";
import { useDispatch } from "react-redux";

import { NodeInAppAttribName } from "@_constants/main";
import { THtmlNodeData } from "@_node/html";
import { TNode, TNodeUid } from "@_node/types";
import { MainContext, focusFNNode, selectFNNode } from "@_redux/main";

export const createAndInsertElement = (
	targetUid: TNodeUid,
	node: TNode,
	contentNode: TNode | null,
	contentRef: RefObject<HTMLIFrameElement | null>,
  ) => {

	const dispatch = useDispatch();
  const {
    removeRunningActions,
    setNeedToReloadIFrame,
  } = useContext(MainContext);


	const nodeData = node.data as THtmlNodeData;
	let newElement;
  
	if (nodeData.name === "!--...--" || nodeData.name === "comment") {
	  const targetElement = contentRef?.current?.contentWindow?.document?.querySelector(
		`[${NodeInAppAttribName}="${targetUid}"]`
	  );
	  // targetElement?.append('<!--...-->')
	} else {
	  newElement = contentRef?.current?.contentWindow?.document?.createElement(
		nodeData.name
	  );
	  for (const attrName in nodeData.attribs) {
		newElement?.setAttribute(attrName, nodeData.attribs[attrName]);
	  }
	  if (contentNode && newElement) {
		const contentNodeData = contentNode.data as THtmlNodeData;
		newElement.innerHTML = contentNodeData.htmlInApp;
	  }
  
	  if (nodeData.name === "html") {
		const existHTML = contentRef?.current?.contentWindow?.document?.querySelector(
		  "html"
		) as Node;
		if (existHTML) {
		  contentRef?.current?.contentWindow?.document?.removeChild(existHTML);
		}
		newElement &&
		  contentRef?.current?.contentWindow?.document?.appendChild(newElement);
		setNeedToReloadIFrame(true);
	  } else {
		const targetElement = contentRef?.current?.contentWindow?.document?.querySelector(
		  `[${NodeInAppAttribName}="${targetUid}"]`
		);
		newElement && targetElement?.parentElement?.insertBefore(
		  newElement,
		  targetElement.nextElementSibling
		);
	  }
	}
  
	setTimeout(() => {
	  dispatch(focusFNNode(node.uid));
	  dispatch(selectFNNode([node.uid]));
	}, 100);
	removeRunningActions(["stageView-viewState"]);
  };