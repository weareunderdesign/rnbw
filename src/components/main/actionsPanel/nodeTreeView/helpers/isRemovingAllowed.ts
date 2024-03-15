import { THtmlNodeData } from "@_node/index";
import { TNodeTreeData, TNodeUid } from "@_node/types";

export const isRemovingAllowed = (
  nodeTree: TNodeTreeData,
  uids: TNodeUid[],
) => {
  let allow = true;
  let htmlTagCount = 0,
    bodyTagCount = 0,
    headTagCount = 0;
  for (const x in nodeTree) {
    (nodeTree[x]?.data as THtmlNodeData).name === "html" &&
      (nodeTree[x]?.data as THtmlNodeData).type === "tag" &&
      htmlTagCount++;
    (nodeTree[x]?.data as THtmlNodeData).name === "body" &&
      (nodeTree[x]?.data as THtmlNodeData).type === "tag" &&
      bodyTagCount++;
    (nodeTree[x]?.data as THtmlNodeData).name === "head" &&
      (nodeTree[x]?.data as THtmlNodeData).type === "tag" &&
      headTagCount++;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uids.map((_uid: any) => {
    const node = nodeTree[_uid];
    const nodeData = nodeTree[_uid].data as THtmlNodeData;
    if (!node || !nodeData) {
      allow = false;
      return;
    }
    if (
      (nodeData.name === "html" &&
        nodeData.type === "tag" &&
        htmlTagCount === 1) ||
      (nodeData.name === "head" &&
        nodeData.type === "tag" &&
        headTagCount === 1) ||
      (nodeData.name === "body" &&
        nodeData.type === "tag" &&
        bodyTagCount === 1)
    ) {
      allow = false;
      return;
    }
  });

  return allow;
};
