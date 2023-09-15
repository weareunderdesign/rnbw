import { NodeInAppAttribName } from "@_constants/main";
import { THtmlNodeData } from "@_node/html";
import { TNode, TNodeUid } from "@_node/types";
import { 
	MainContext, 
	expandFNNode, 
	focusFNNode, 
	navigatorSelector, 
	selectFNNode, 
	updateFNTreeViewState 
} from "@_redux/main";
import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

export interface IUseSideEffectHandlersProps{
	contentRef: HTMLIFrameElement | null,
}

export const useSideEffectHandlers = ({contentRef}:IUseSideEffectHandlersProps) =>{

  const dispatch = useDispatch();
  const { file } = useSelector(navigatorSelector);
  const {
    // global action
    removeRunningActions,
    // node actions
    clipboardData,
    // node tree view
    nodeTree,
    // stage view
    setNeedToReloadIFrame,
  } = useContext(MainContext);

	const addElement = useCallback(
		(targetUid: TNodeUid, node: TNode, contentNode: TNode | null) => {
		  // build new element
		  const nodeData = node.data as THtmlNodeData;
		  let newElement;
		  if (nodeData.name === "!--...--" || nodeData.name === "comment") {
			const targetElement =
			  contentRef?.contentWindow?.document?.querySelector(
				`[${NodeInAppAttribName}="${targetUid}"]`,
			  );
			// targetElement?.append('<!--...-->')
		  } else if (nodeData.name === "html") {
			newElement = contentRef?.contentWindow?.document?.createElement(
			  nodeData.name,
			);
			for (const attrName in nodeData.attribs) {
			  newElement &&
				newElement?.setAttribute(attrName, nodeData.attribs[attrName]);
			}
			if (contentNode && newElement) {
			  const contentNodeData = contentNode.data as THtmlNodeData;
			  newElement.innerHTML = contentNodeData.htmlInApp;
			}
			let existHTML = contentRef?.contentWindow?.document?.querySelector(
			  "html",
			) as Node;
			if (existHTML) {
			  contentRef?.contentWindow?.document?.removeChild(existHTML);
			}
			newElement &&
			  contentRef?.contentWindow?.document?.appendChild(newElement);
			setNeedToReloadIFrame(true);
		  } else {
			newElement = contentRef?.contentWindow?.document?.createElement(
			  nodeData.name,
			);
			for (const attrName in nodeData.attribs) {
			  newElement?.setAttribute(attrName, nodeData.attribs[attrName]);
			}
			if (contentNode && newElement) {
			  const contentNodeData = contentNode.data as THtmlNodeData;
			  newElement.innerHTML = contentNodeData.htmlInApp;
			}
			// add after target
			const targetElement =
			  contentRef?.contentWindow?.document?.querySelector(
				`[${NodeInAppAttribName}="${targetUid}"]`,
			  );
			newElement &&
			  targetElement?.parentElement?.insertBefore(
				newElement,
				targetElement.nextElementSibling,
			  );
		  }
		  // view state
		  setTimeout(() => {
			dispatch(focusFNNode(node.uid));
			dispatch(selectFNNode([node.uid]));
		  }, 100);
		  removeRunningActions(["stageView-viewState"]);
		},
		[removeRunningActions, contentRef, nodeTree],
	  );

	  const groupElement = useCallback(
		(
		  targetUid: TNodeUid,
		  node: TNode,
		  contentNode: TNode | null,
		  deleteUids: TNodeUid[],
		) => {
		  // build new element
		  const nodeData = node.data as THtmlNodeData;
		  let newElement;
		  if (nodeData.name === "!--...--" || nodeData.name === "comment") {
			const targetElement =
			  contentRef?.contentWindow?.document?.querySelector(
				`[${NodeInAppAttribName}="${targetUid}"]`,
			  );
			// targetElement?.append('<!--...-->')
		  } else if (nodeData.name === "html") {
			newElement = contentRef?.contentWindow?.document?.createElement(
			  nodeData.name,
			);
			for (const attrName in nodeData.attribs) {
			  newElement &&
				newElement?.setAttribute(attrName, nodeData.attribs[attrName]);
			}
			if (contentNode && newElement) {
			  const contentNodeData = contentNode.data as THtmlNodeData;
			  newElement.innerHTML = contentNodeData.htmlInApp;
			}
			let existHTML = contentRef?.contentWindow?.document?.querySelector(
			  "html",
			) as Node;
			if (existHTML) {
			  contentRef?.contentWindow?.document?.removeChild(existHTML);
			}
			newElement &&
			  contentRef?.contentWindow?.document?.appendChild(newElement);
			setNeedToReloadIFrame(true);
		  } else {
			newElement = contentRef?.contentWindow?.document?.createElement(
			  nodeData.name,
			);
			for (const attrName in nodeData.attribs) {
			  newElement?.setAttribute(attrName, nodeData.attribs[attrName]);
			}
			if (contentNode && newElement) {
			  const contentNodeData = contentNode.data as THtmlNodeData;
			  newElement.innerHTML = contentNodeData.htmlInApp;
			}
			// add after target
			const targetElement =
			  contentRef?.contentWindow?.document?.querySelector(
				`[${NodeInAppAttribName}="${targetUid}"]`,
			  );
			newElement && targetElement?.appendChild(newElement);
		  }
	
		  // remove org elements
		  deleteUids.map((uid) => {
			const ele = contentRef?.contentWindow?.document?.querySelector(
			  `[${NodeInAppAttribName}="${uid}"]`,
			);
			ele?.remove();
		  });
		  // view state
		  setTimeout(() => {
			dispatch(focusFNNode(node.uid));
			dispatch(selectFNNode([node.uid]));
			dispatch(expandFNNode([node.uid]));
		  }, 200);
		  removeRunningActions(["stageView-viewState"]);
		},
		[removeRunningActions, contentRef],
	  );

	  const removeElements = useCallback(
		(uids: TNodeUid[], deletedUids: TNodeUid[], lastUid: TNodeUid) => {
		  uids.map((uid) => {
			const ele = contentRef?.contentWindow?.document?.querySelector(
			  `[${NodeInAppAttribName}="${uid}"]`,
			);
			ele?.remove();
		  });
		  setTimeout(() => {
			if (lastUid && lastUid !== "") {
			  dispatch(focusFNNode(lastUid));
			  dispatch(selectFNNode([lastUid]));
			}
		  }, 200);
		  // view state
		  dispatch(updateFNTreeViewState({ deletedUids }));
		  removeRunningActions(["stageView-viewState"]);
		},
		[removeRunningActions, contentRef],
	  );

	  const moveElements = useCallback(
		(
		  uids: TNodeUid[],
		  targetUid: TNodeUid,
		  isBetween: boolean,
		  position: number,
		) => {
		  const targetElement = contentRef?.contentWindow?.document?.querySelector(
			`[${NodeInAppAttribName}="${targetUid}"]`,
		  );
		  const _elements: (Node | undefined)[] = [];
	
		  // remove from org parents
		  const _uids = [...uids];
		  _uids.reverse();
		  _uids.map((uid) => {
			// clone
			const ele = contentRef?.contentWindow?.document?.querySelector(
			  `[${NodeInAppAttribName}="${uid}"]`,
			);
			_elements.push(ele?.cloneNode(true));
			ele?.remove();
		  });
	
		  // add to new target + position
		  _elements.map((_ele) => {
			const refElement = isBetween
			  ? contentRef?.contentWindow?.document?.querySelector(
				  `[${NodeInAppAttribName}="${targetUid}"] > :nth-child(${
					position + 1
				  })`,
				)
			  : null;
			_ele && targetElement?.insertBefore(_ele, refElement || null);
		  });
	
		  // view state
		  setTimeout(() => {
			dispatch(focusFNNode(uids[uids.length - 1]));
			dispatch(selectFNNode(uids));
		  }, 100);
		  removeRunningActions(["stageView-viewState"]);
		},
		[removeRunningActions, contentRef],
	  );

	  const copyElements = useCallback(
		(
		  uids: TNodeUid[],
		  targetUid: TNodeUid,
		  isBetween: boolean,
		  position: number,
		  addedUidMap: Map<TNodeUid, TNodeUid>,
		) => {
		  const targetElement = contentRef?.contentWindow?.document?.querySelector(
			`[${NodeInAppAttribName}="${targetUid}"]`,
		  );
		  const refElement = isBetween
			? contentRef?.contentWindow?.document?.querySelector(
				`[${NodeInAppAttribName}="${targetUid}"] > :nth-child(${
				  position + 1
				})`,
			  )
			: null;
	
		  uids.map((uid) => {
			// clone
			const ele = contentRef?.contentWindow?.document?.querySelector(
			  `[${NodeInAppAttribName}="${uid}"]`,
			);
			const _ele = ele?.cloneNode(true) as HTMLElement;
	
			// reset nest's uid
			const newUid = addedUidMap.get(uid);
			newUid && _ele.setAttribute(NodeInAppAttribName, newUid);
	
			// reset descendant uids
			const childElementList = _ele.querySelectorAll("*");
			childElementList.forEach((childElement) => {
			  const childUid = childElement.getAttribute(NodeInAppAttribName);
			  if (childUid) {
				const newChildUid = addedUidMap.get(childUid);
				if (newChildUid) {
				  childElement.setAttribute(NodeInAppAttribName, newChildUid);
				}
			  }
			});
	
			// update
			targetElement?.insertBefore(_ele, refElement || null);
		  });
	
		  // view state
		  const newUids = uids
			.map((uid) => addedUidMap.get(uid))
			.filter((uid) => uid) as TNodeUid[];
		  setTimeout(() => {
			dispatch(focusFNNode(newUids[newUids.length - 1]));
			dispatch(selectFNNode(newUids));
		  }, 100);
		  removeRunningActions(["stageView-viewState"]);
		},
		[removeRunningActions, contentRef],
	  );

	  const copyElementsExternal = useCallback(
		(
		  nodes: TNode[],
		  targetUid: TNodeUid,
		  isBetween: boolean,
		  position: number,
		  addedUidMap: Map<TNodeUid, TNodeUid>,
		) => {
		  const targetElement = contentRef?.contentWindow?.document?.querySelector(
			`[${NodeInAppAttribName}="${targetUid}"]`,
		  );
		  const refElement = isBetween
			? contentRef?.contentWindow?.document?.querySelector(
				`[${NodeInAppAttribName}="${targetUid}"] > :nth-child(${
				  position + 1
				})`,
			  )
			: null;
	
		  nodes.map((node) => {
			let _ele: HTMLElement;
			// clone
			const ele = (clipboardData.prevNodeTree[node.uid].data as THtmlNodeData)
			  .htmlInApp;
			var div = document.createElement("div");
			div.innerHTML = ele.trim();
	
			// Change this to div.childNodes to support multiple top-level nodes.
	
			_ele = div.firstChild as HTMLElement;
			// reset nest's uid
			const newUid = addedUidMap.get(node.uid);
			newUid && _ele.setAttribute(NodeInAppAttribName, newUid);
	
			// reset descendant uids
			const childElementList = _ele.querySelectorAll("*");
			childElementList.forEach((childElement) => {
			  const childUid = childElement.getAttribute(NodeInAppAttribName);
			  if (childUid) {
				const newChildUid = addedUidMap.get(childUid);
				if (newChildUid) {
				  childElement.setAttribute(NodeInAppAttribName, newChildUid);
				}
			  }
			});
			// update
			targetElement?.insertBefore(_ele, refElement || null);
		  });
	
		  // view state
		  const newUids = nodes
			.map((node) => addedUidMap.get(node.uid))
			.filter((_nd) => _nd) as TNodeUid[];
		  setTimeout(() => {
			dispatch(focusFNNode(newUids[newUids.length - 1]));
			dispatch(selectFNNode(newUids));
		  }, 100);
		  removeRunningActions(["stageView-viewState"]);
		},
		[removeRunningActions, contentRef, clipboardData, file.uid],
	  );

	  const duplicateElements = useCallback(
		(uids: TNodeUid[], addedUidMap: Map<TNodeUid, TNodeUid>) => {
		  uids.map((uid) => {
			// clone
			const ele = contentRef?.contentWindow?.document?.querySelector(
			  `[${NodeInAppAttribName}="${uid}"]`,
			);
			const _ele = ele?.cloneNode(true) as HTMLElement;
	
			// reset nest's uid
			const newUid = addedUidMap.get(uid);
			newUid && _ele.setAttribute(NodeInAppAttribName, newUid);
	
			// reset descendant uids
			const childElementList = _ele.querySelectorAll("*");
			childElementList.forEach((childElement) => {
			  const childUid = childElement.getAttribute(NodeInAppAttribName);
			  if (childUid) {
				const newChildUid = addedUidMap.get(childUid);
				if (newChildUid) {
				  childElement.setAttribute(NodeInAppAttribName, newChildUid);
				}
			  }
			});
	
			// update
			ele?.parentElement?.insertBefore(_ele, ele.nextElementSibling);
		  });
	
		  // view state
		  const newUids = uids
			.map((uid) => addedUidMap.get(uid))
			.filter((uid) => uid) as TNodeUid[];
		  setTimeout(() => {
			dispatch(focusFNNode(newUids[newUids.length - 1]));
			dispatch(selectFNNode(newUids));
		  }, 100);
		  removeRunningActions(["stageView-viewState"]);
		},
		[removeRunningActions, contentRef],
	  );

	  return{
		addElement,
		groupElement,
		removeElements,
		moveElements,
		copyElements,
		copyElementsExternal,
		duplicateElements,
	  }
}