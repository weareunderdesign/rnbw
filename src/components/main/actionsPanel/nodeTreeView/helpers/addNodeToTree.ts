import { TNodeTreeData, TNodeUid, TNode } from "@_node/types";
import { THtmlNodeData } from "@_node/index";
import { NodeInAppAttribName } from "@_constants/main";

export const addNodeToTree = (
  _tree: TNodeTreeData | null,
  tree: TNodeTreeData,
  nodeTree: TNodeTreeData,
  focusedItem: TNodeUid,
  newNode: TNode,
  tmpMaxUid: TNodeUid,
) => {
  let _parent = tree[nodeTree[focusedItem].parentUid as TNodeUid];
  for (let x in _tree) {
    if (x === "text") continue;
    if (x === "ROOT") {
      _tree[x].uid = String(Number(tmpMaxUid) + 1);
      _tree[x].parentUid =
        focusedItem !== "ROOT" && _parent !== undefined
          ? nodeTree[focusedItem].parentUid
          : "ROOT";
      _tree[x].name = newNode.name;
      _tree[x].data.type = "tag";
      _tree[x].data.name = newNode.name;
      _tree[x].data.valid = true;
      (_tree[x].data as THtmlNodeData).attribs = {
        [NodeInAppAttribName]: String(Number(tmpMaxUid) + 1) as TNodeUid,
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
