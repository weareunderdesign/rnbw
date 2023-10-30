import { StageNodeIdAttr } from "@_node/html";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { IEditorRef } from "@_redux/main";
import { editor } from "monaco-editor";
import { DraggingPosition } from "react-complex-tree";

export const sortUidsByMaxEndIndex = (
  uids: TNodeUid[],
  validNodeTree: TNodeTreeData,
) => {
  return uids.slice().sort((uid1, uid2) => {
    const selectedNode1 = validNodeTree[uid1];
    const selectedNode2 = validNodeTree[uid2];

    if (
      !selectedNode1 ||
      !selectedNode1.data.sourceCodeLocation ||
      !selectedNode2 ||
      !selectedNode2.data.sourceCodeLocation
    ) {
      console.error(
        "Parent node or source code location is undefined for sortedUid",
      );
      return 0;
    }

    const { endLine: endLine1 } = selectedNode1.data.sourceCodeLocation;
    const { endLine: endLine2 } = selectedNode2.data.sourceCodeLocation;

    return endLine2 - endLine1; // Sort in descending order
  });
};
export const getCopiedContent = (uid: TNodeUid, iframe: any) => {
  const ele = iframe?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${uid}"]`,
  );

  //create a copy of ele
  const eleCopy = ele?.cloneNode(true) as HTMLElement;
  const innerElements = eleCopy.querySelectorAll(`[${StageNodeIdAttr}]`);

  innerElements.forEach((element) => {
    if (element.hasAttribute(StageNodeIdAttr)) {
      element.removeAttribute(StageNodeIdAttr);
    }
  });

  eleCopy?.removeAttribute("contenteditable");
  eleCopy?.removeAttribute("rnbwdev-rnbw-element-hover");
  eleCopy?.removeAttribute("rnbwdev-rnbw-element-select");
  eleCopy?.removeAttribute(StageNodeIdAttr);
  const cleanedUpCode = eleCopy?.outerHTML;

  //delete the copy
  eleCopy?.remove();

  return cleanedUpCode;
};

export const isNestingProhibited = (targetNodeTagName: string) => {
  const selfClosingTags = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ];

  return selfClosingTags.some((tag) => tag === targetNodeTagName);
};
export const getDropOptions = (
  target: DraggingPosition,
  validNodeTree: TNodeTreeData,
  model: editor.ITextModel,
) => {
  const isBetween = target.targetType === "between-items";
  const targetUid = (
    isBetween ? target.parentItem : target.targetItem
  ) as TNodeUid;

  const order = isBetween ? target.childIndex : 0;
  const targetNode = validNodeTree[targetUid];
  const childrenNodes = targetNode.children;

  const isFirstNesting = !isBetween && !childrenNodes.length;
  const targetNodeTagName = targetNode.data.name;

  if (isFirstNesting && isNestingProhibited(targetNodeTagName)) {
    console.log("The target node cannot have children");
    return undefined;
  }

  const insideNestingPosition = isFirstNesting
    ? targetNode?.data.sourceCodeLocation
    : validNodeTree[childrenNodes[childrenNodes.length - 1]]?.data
        ?.sourceCodeLocation;

  const betweenNestingPosition = order
    ? validNodeTree[childrenNodes[order - 1]]?.data?.sourceCodeLocation
    : validNodeTree[childrenNodes[0]]?.data?.sourceCodeLocation;

  const {
    endLine,
    endCol,
    startCol,
    startLine,
    endOffset: targetendOffset,
  } = !isBetween ? insideNestingPosition : betweenNestingPosition;

  const { lineNumber, column } = model.getPositionAt(
    targetendOffset - targetNodeTagName.length - 3,
  );

  const position: { lineNumber: number; column: number } = {
    lineNumber:
      isBetween && !order
        ? startLine
        : !childrenNodes.length
        ? lineNumber
        : endLine,
    column:
      isBetween && !order
        ? startCol
        : !childrenNodes.length
        ? column
        : endCol + 1,
  };

  return { position, isBetween, order, targetendOffset, targetUid };
};
