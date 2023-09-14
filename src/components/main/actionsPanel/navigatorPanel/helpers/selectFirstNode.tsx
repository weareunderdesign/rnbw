import {
  ActionCreatorWithPayload,
  AnyAction,
  Dispatch,
} from "@reduxjs/toolkit";
import { TNodeTreeData } from "@_node/types";

export const selectFirstNode = (
  validNodeTree: TNodeTreeData,
  isFirst: boolean,
  selectFNNode: ActionCreatorWithPayload<string[], "main/selectFNNode">,
  dispatch: Dispatch<AnyAction>,
) => {
  let bodyId = "0";
  for (let x in validNodeTree) {
    if (
      validNodeTree[x].data.type === "tag" &&
      validNodeTree[x].data.name === "body"
    ) {
      bodyId = validNodeTree[x].uid;
      break;
    }
  }

  if (bodyId !== "0") {
    let firstNodeId = "0";
    for (let x in validNodeTree) {
      if (
        validNodeTree[x].data.type === "tag" &&
        validNodeTree[x].parentUid === bodyId
      ) {
        firstNodeId = validNodeTree[x].uid;
        break;
      }
    }
    if (firstNodeId !== "0") {
      dispatch(selectFNNode([firstNodeId]));
      isFirst = false;
    }
  }
};
