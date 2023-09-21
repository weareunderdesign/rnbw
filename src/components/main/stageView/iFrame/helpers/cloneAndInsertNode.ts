import { NodeInAppAttribName } from "@_constants/main";
import { THtmlNodeData } from "@_node/html";
import { TNode, TNodeUid } from "@_node/types";
import { TClipboardData } from "@_types/main";

export const cloneAndInsertNode = (
  node: TNode,
  addedUidMap: Map<TNodeUid, TNodeUid>,
  targetElement: any,
  refElement: any,
  clipboardData: TClipboardData,
) => {
  const ele: string = (
    clipboardData.prevNodeTree[node.uid].data as THtmlNodeData
  ).htmlInApp;

  const div = document.createElement("div");

  if (ele) {
    div.innerHTML = ele.trim();
  }

  const _ele = div;

  const newUid = addedUidMap.get(node.uid);
  if (newUid) {
    _ele.setAttribute(NodeInAppAttribName, newUid);
  }

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

  targetElement?.insertBefore(_ele, refElement || null);
};
