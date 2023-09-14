import { TNode } from "@_node/types";

export const isHomeIcon = (node: TNode) =>
  node.data.type == "html" &&
  node.data.name == "index" &&
  node.parentUid === "ROOT";
