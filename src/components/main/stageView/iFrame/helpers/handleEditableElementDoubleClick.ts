import { useContext } from "react";

import { NodeInAppAttribName } from "@_constants/main";
import { THtmlNodeData } from "@_node/html";
import { MainContext } from "@_redux/main";

export const handleEditableElementDoubleClick = (
	ele:HTMLElement,
	contentEditableUidRef: React.MutableRefObject<string>,
	isEditing: React.MutableRefObject<boolean>,
	contentRef: HTMLIFrameElement | null
) => {

	const {
	  validNodeTree,
	} = useContext(MainContext);

	const uid = ele.getAttribute(NodeInAppAttribName);
	if (!uid || contentEditableUidRef.current === uid) return;
  
	const node = validNodeTree[uid];
	if (!node) return;
  
	const nodeData = node.data as THtmlNodeData;
	if (
	  ["html", "head", "body", "img", "div"].includes(nodeData.name)
	) return;
  
	const cleanedUpCode = ele.outerHTML.replace(
	  /rnbwdev-rnbw-element-hover=""|rnbwdev-rnbw-element-select=""|contenteditable="true"|contenteditable="false"/g,
	  "",
	);
  
	// Handle pasting into the editable element
	ele.addEventListener("paste", (event) => {
	  event.preventDefault();
	  if (isEditing.current) {
		const pastedText = // @ts-ignore
		  (event.clipboardData || window.clipboardData).getData("text");
  
		// Remove all HTML tags from the pasted text while keeping the content using a regular expression
		const cleanedText = pastedText.replace(
		  /<\/?([\w\s="/.':;#-\/\?]+)>/gi,
		  (match:any, tagContent:any) => tagContent,
		);
		cleanedText.replaceAll("\n\r", "<br>");
  
		// Insert the cleaned text into the editable div
		contentRef?.contentWindow?.document.execCommand(
		  "insertText",
		  false,
		  cleanedText,
		);
		isEditing.current = false;
		setTimeout(() => {
		  isEditing.current = true;
		}, 50);
	  }
	});
  
	// Handle setting content editable
	ele.setAttribute("contenteditable", "true");
	contentEditableUidRef.current = uid;
  
	// Select all text
	const range = contentRef?.contentWindow?.document.createRange();
	if (range) {
	  range.selectNodeContents(ele);
	  const selection = contentRef?.contentWindow?.getSelection();
	  selection?.removeAllRanges();
	  selection?.addRange(range);
	}
  };