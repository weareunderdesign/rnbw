import { THtmlNodeData } from "@_node/html";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { handleTextPaste, selectAllText } from ".";

export const handleElementClick = (
  ele: HTMLElement,
  uid: TNodeUid,
  contentRef: HTMLIFrameElement | null,
  contentEditableUidRef: React.MutableRefObject<TNodeUid | null>,
  isEditing: React.MutableRefObject<boolean>,
  e: MouseEvent,
  validNodeTree: TNodeTreeData,
) => {
  const node = validNodeTree[uid];
  if (!node) return;

  if (contentEditableUidRef.current === uid) return;

  const nodeData = node.data as THtmlNodeData;
  if (["html", "head", "body", "img", "div"].includes(nodeData.name)) return;

  isEditing.current = true;
  ele.addEventListener("paste", (event: any) => {
    handleTextPaste(event, isEditing, contentRef);
  });
  ele.setAttribute("contenteditable", "true");
  contentEditableUidRef.current = uid;
  ele.focus();
  selectAllText(contentRef, ele);
};
