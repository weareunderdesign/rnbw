import { editor } from "monaco-editor";
import { DraggingPosition } from "react-complex-tree";

import { LogAllow } from "@src/rnbwTSX";
import { StageNodeIdAttr } from "@_api/file/handlers";
import { TNode, TNodeTreeData, TNodeUid } from "@_api/types";
import { RootNodeUid } from "@src/rnbwTSX";
import { elementsCmdk } from "@src/helper";
import { TCmdkGroupData, THtmlReferenceData } from "@_types/main.types";

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

    const { endOffset: endOffset1 } = selectedNode1.data.sourceCodeLocation;
    const { endOffset: endOffset2 } = selectedNode2.data.sourceCodeLocation;

    return endOffset2 - endOffset1; // Sort in descending order
  });
};
export const sortUidsByMinStartIndex = (
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

    const { startOffset: start1 } = selectedNode1.data.sourceCodeLocation;
    const { startOffset: start2 } = selectedNode2.data.sourceCodeLocation;

    return start1 - start2; // Sort in ascending order
  });
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCopiedContent = (uid: TNodeUid, iframe: any) => {
  const ele = iframe?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${uid}"]`,
  );
  if (!ele) return;

  //create a copy of ele
  const eleCopy = ele?.cloneNode(true) as HTMLElement;
  const innerElements = eleCopy.querySelectorAll(`[${StageNodeIdAttr}]`);

  innerElements.forEach((element) => {
    if (element.hasAttribute(StageNodeIdAttr)) {
      element.removeAttribute(StageNodeIdAttr);
      element?.removeAttribute("rnbwdev-rnbw-element-hover");
    }
  });

  eleCopy.removeAttribute("contenteditable");
  eleCopy.removeAttribute("rnbwdev-rnbw-element-hover");
  eleCopy.removeAttribute("rnbwdev-rnbw-element-select");
  eleCopy.removeAttribute(StageNodeIdAttr);
  const cleanedUpCode = eleCopy.outerHTML;

  //delete the copy
  eleCopy.remove();

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
  const targetNodeTagName = targetNode.data.nodeName;

  if (isFirstNesting && isNestingProhibited(targetNodeTagName)) {
    LogAllow && console.log("The target node cannot have children");
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
export const addTextNodeToElements = (data: TCmdkGroupData) => {
  data["Elements"].push({
    Featured: false,
    Name: "text",
    Icon: "comment",
    Description: "text element",
    "Keyboard Shortcut": [
      {
        cmd: false,
        shift: false,
        alt: false,
        key: "",
        click: false,
      },
    ],
    Group: "",
    Context: `Node-<#text>`,
  });
};
export const isAllElementPastingAllowed = ({
  htmlReferenceData,
  validNodeTree,
  uid,
  isMove,
}: {
  htmlReferenceData: THtmlReferenceData;
  validNodeTree: TNodeTreeData;
  uid: TNodeUid;
  isMove?: boolean;
}) => {
  const targetNode = validNodeTree[uid];
  const parentTarget = targetNode.parentUid;
  if (!parentTarget) return;

  return (
    htmlReferenceData?.elements[
      isMove
        ? validNodeTree[uid]?.displayName
        : validNodeTree[parentTarget]?.displayName
    ]?.Contain === "All"
  );
};

export const isPastingAllowed = ({
  selectedItems,
  htmlReferenceData,
  nodeToAdd,
  validNodeTree,
  isMove = false,
}: {
  selectedItems: TNodeUid[];
  htmlReferenceData: THtmlReferenceData;
  nodeToAdd: string[];
  validNodeTree: TNodeTreeData;
  isMove?: boolean;
}) => {
  const selectedUids = [...selectedItems];
  const selectedNodes = selectedItems.map((uid) => validNodeTree[uid]);

  const checkAddingAllowed = (uid: string) => {
    const data: TCmdkGroupData = {
      Files: [],
      Elements: [],
      Recent: [],
    };

    elementsCmdk({
      validNodeTree,
      nFocusedItem: uid,
      htmlReferenceData,
      data,
      groupName: "Add",
      isMove,
    });

    return nodeToAdd.every((node: string) => {
      if (node.split("-").length > 2) {
        return isAllElementPastingAllowed({
          htmlReferenceData,
          validNodeTree,
          uid,
          isMove,
        });
      } else {
        if (node === "Node-<#text>") {
          const textNodeAllowed = isAllElementPastingAllowed({
            htmlReferenceData,
            validNodeTree,
            uid,
            isMove,
          });

          textNodeAllowed && addTextNodeToElements(data);
        }

        return Object.values(data["Elements"]).some(
          (obj) => obj["Context"] === node,
        );
      }
    });
  };
  let skipPosition;

  const allowedArray = selectedNodes.map((selectedNode: TNode, i: number) => {
    let addingAllowed =
      (selectedNode.displayName == "body" &&
        selectedNode.children.length == 0) ||
      checkAddingAllowed(selectedNode.uid);
    skipPosition = !addingAllowed;

    if (
      !addingAllowed &&
      selectedNode?.parentUid &&
      selectedNode?.parentUid !== RootNodeUid
    ) {
      selectedUids[i] = selectedNode.parentUid;
      addingAllowed = checkAddingAllowed(selectedNode.parentUid);
    }
    return addingAllowed;
  });

  return {
    isAllowed: !allowedArray.includes(false),
    selectedUids,
    skipPosition,
  };
};
