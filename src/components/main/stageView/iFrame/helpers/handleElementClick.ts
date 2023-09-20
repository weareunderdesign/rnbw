import { THtmlNodeData } from "@_node/html";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { handleTextPaste, selectAllText } from ".";

export const handleElementClick = (
	ele: HTMLElement,
	uid: TNodeUid,
	contentRef: HTMLIFrameElement | null, 
	contentEditableUidRef: React.MutableRefObject<TNodeUid | null>, 
	isEditing: React.MutableRefObject<boolean>,
	e:MouseEvent,
	setOuterHtml:(arg:string)=>void,
	setContentEditableAttr: React.Dispatch<React.SetStateAction<string | null>>,
	validNodeTree: TNodeTreeData
  ) => {

	const node = validNodeTree[uid];
	if (!node) return;
  
	if (contentEditableUidRef.current === uid) return;
  
	const nodeData = node.data as THtmlNodeData;
	if (["html", "head", "body", "img", "div"].includes(nodeData.name)) return;
  
	const cleanedUpCode = ele.outerHTML.replace(/rnbwdev-rnbw-element-hover=""|rnbwdev-rnbw-element-select=""|contenteditable="true"|contenteditable="false"/g, "");
	setOuterHtml(cleanedUpCode);
	if (ele.hasAttribute("contenteditable")) {
	  setContentEditableAttr(ele.getAttribute("contenteditable"));
	}
	isEditing.current = true;
	ele.addEventListener("paste", (event:any) => {
	  handleTextPaste(event, isEditing, contentRef);
	});
	const clickEvent = new MouseEvent("click", {
	  view: contentRef?.contentWindow,
	  bubbles: true,
	  cancelable: true,
	  clientX: e.clientX,
	  clientY: e.clientY,
	});
	ele.setAttribute("contenteditable", "true");
	contentEditableUidRef.current = uid;
	ele.focus();
	selectAllText(contentRef, ele);
  };