import { StageNodeIdAttr } from "@_node/file/handlers/constants";
import { THtmlNodeData } from "@_node/index";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";

export const addNodeToTree = (
  _tree: TNodeTreeData | null,
  tree: TNodeTreeData,
  nodeTree: TNodeTreeData,
  focusedItem: TNodeUid,
  newNode: TNode,
  tmpMaxUid: TNodeUid,
) => {
  const _parent = tree[nodeTree[focusedItem].parentUid!];
  for (const x in _tree) {
    if (x === "text") continue;
    if (x === "ROOT") {
      _tree[x].uid = String(Number(tmpMaxUid) + 1);
      _tree[x].parentUid =
        focusedItem !== "ROOT" && _parent !== undefined
          ? nodeTree[focusedItem].parentUid
          : "ROOT";
      _tree[x].displayName = newNode.displayName;
      _tree[x].data.type = "tag";
      _tree[x].data.name = newNode.displayName;
      _tree[x].data.valid = true;
      (_tree[x].data as THtmlNodeData).attribs = {
        [StageNodeIdAttr]: String(Number(tmpMaxUid) + 1) as TNodeUid,
      };
      newNode.uid = String(Number(tmpMaxUid) + 1);
      tree[String(Number(tmpMaxUid) + 1)] = _tree[x];
      if (focusedItem !== "ROOT" && _parent !== undefined) {
        _parent.children.push(String(Number(tmpMaxUid) + 1));
      } else {
        tree["ROOT"].children.push(String(Number(tmpMaxUid) + 1));
      }
    } else {
      if (_tree[x].parentUid === "ROOT") {
        _tree[x].parentUid = String(Number(tmpMaxUid) + 1);
      }
      tree[x] = _tree[x];
    }
  }
};
