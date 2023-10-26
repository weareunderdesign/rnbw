import { RefObject } from "react";

import { NodeUidAttribNameInApp } from "@_constants/main";
import { THtmlNodeData } from "@_node/html";
import { TNode, TNodeUid } from "@_node/types";
import { focusFNNode, selectFNNode } from "@_redux/main";
import { AnyAction, Dispatch } from "@reduxjs/toolkit";

export const createAndInsertElement = (
  targetUid: TNodeUid,
  node: TNode,
  contentNode: TNode | null,
  contentRef: RefObject<HTMLIFrameElement | null>,
  dispatch: Dispatch<AnyAction>,
  removeRunningActions: (
    actionNames: string[],
    effect?: boolean | undefined,
  ) => void,
  setNeedToReloadIFrame: (_needToReloadIFrame: boolean) => void,
) => {
  const nodeData = node.data as THtmlNodeData;
  let newElement;

  if (nodeData.name === "!--...--" || nodeData.name === "comment") {
    const targetElement =
      contentRef?.current?.contentWindow?.document?.querySelector(
        `[${NodeUidAttribNameInApp}="${targetUid}"]`,
      );
    // targetElement?.append('<!--...-->')
  } else {
    newElement = contentRef?.current?.contentWindow?.document?.createElement(
      nodeData.name,
    );
    for (const attrName in nodeData.attribs) {
      newElement?.setAttribute(attrName, nodeData.attribs[attrName]);
    }
    if (contentNode && newElement) {
      const contentNodeData = contentNode.data as THtmlNodeData;
      newElement.innerHTML = contentNodeData.htmlInApp;
    }

    if (nodeData.name === "html") {
      const existHTML =
        contentRef?.current?.contentWindow?.document?.querySelector(
          "html",
        ) as Node;
      if (existHTML) {
        contentRef?.current?.contentWindow?.document?.removeChild(existHTML);
      }
      newElement &&
        contentRef?.current?.contentWindow?.document?.appendChild(newElement);
      setNeedToReloadIFrame(true);
    } else {
      const targetElement =
        contentRef?.current?.contentWindow?.document?.querySelector(
          `[${NodeUidAttribNameInApp}="${targetUid}"]`,
        );
      newElement &&
        targetElement?.parentElement?.insertBefore(
          newElement,
          targetElement.nextElementSibling,
        );
    }
  }

  setTimeout(() => {
    dispatch(focusFNNode(node.uid));
    dispatch(selectFNNode([node.uid]));
  }, 100);
  removeRunningActions(["stageView-viewState"]);
};
