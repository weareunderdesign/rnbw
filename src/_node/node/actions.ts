import { editor, Range } from "monaco-editor";
import {
  getNodeChildIndex,
  getSubNodeUidsByBfs,
  TNodeApiPayload,
  TNodeReferenceData,
  TNodeTreeData,
  TNodeUid,
} from "..";
import { html_beautify } from "js-beautify";
import {
  sortUidsByMaxEndIndex,
  sortUidsByMinStartIndex,
} from "@_components/main/actionsPanel/nodeTreeView/helpers";
import {
  AddNodeActionPrefix,
  DefaultTabSize,
  NodePathSplitter,
  RenameNodeActionPrefix,
} from "@_constants/main";
import { THtmlReferenceData } from "@_types/main";
import { LogAllow } from "@_constants/global";
import { copyCode, pasteCode, replaceContent } from "./helpers";
import { getValidNodeTree } from "@_pages/main/processor/helpers";
import { setNeedToSelectNodePaths } from "@_redux/main/nodeTree";

const add = ({
  actionName,
  referenceData,
  nodeTree,
  focusedItem,
  codeViewInstanceModel,
}: {
  actionName: string;
  referenceData: TNodeReferenceData;
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  codeViewInstanceModel: editor.ITextModel;
}): string[] => {
  const tagName = actionName.slice(
    AddNodeActionPrefix.length + 2,
    actionName.length - 1,
  );
  const htmlReferenceData = referenceData as THtmlReferenceData;
  const HTMLElement = htmlReferenceData.elements[tagName];

  let openingTag = HTMLElement.Tag;
  if (HTMLElement.Attributes) {
    const tagArray = openingTag.split("");
    tagArray.splice(tagArray.length - 1, 0, ` ${HTMLElement.Attributes}`);
    openingTag = tagArray.join("");
  }
  const closingTag = `</${tagName}>`;

  const tagContent = !!HTMLElement.Content ? HTMLElement.Content : "";

  const codeViewText =
    HTMLElement.Contain === "None"
      ? openingTag
      : `${openingTag}${tagContent}${closingTag}`;

  const focusedNode = nodeTree[focusedItem];
  const { endLine, endCol } = focusedNode.data.sourceCodeLocation;
  const edit = {
    range: new Range(endLine, endCol, endLine, endCol),
    text: codeViewText,
  };
  codeViewInstanceModel.applyEdits([edit]);

  // predict needToSelectNodePaths
  const needToSelectNodePaths = (() => {
    const needToSelectNodePaths: string[] = [];
    const validNodeTree = getValidNodeTree(nodeTree);
    const targetNode = validNodeTree[focusedItem];
    const targetParentNode = validNodeTree[targetNode.parentUid as TNodeUid];
    const targetNodeChildIndex = getNodeChildIndex(
      targetParentNode,
      targetNode,
    );
    const newNodePath = `${
      targetParentNode.data.path
    }${NodePathSplitter}${tagName}-${targetNodeChildIndex + 1}`;
    needToSelectNodePaths.push(newNodePath);
    return needToSelectNodePaths;
  })();
  return needToSelectNodePaths;
};
const remove = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}): string[] => {
  const sortedUids = sortUidsByMaxEndIndex(uids, nodeTree);
  sortedUids.forEach((uid) => {
    const node = nodeTree[uid];
    if (node) {
      const { startCol, startLine, endCol, endLine } =
        node.data.sourceCodeLocation;
      const edit = {
        range: new Range(startLine, startCol, endLine, endCol),
        text: "",
      };
      codeViewInstanceModel.applyEdits([edit]);
    }
  });

  // predict needToSelectNodePaths
  return [];
};

const cut = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}): string[] => {
  copy({ nodeTree, uids, codeViewInstanceModel });
  remove({ nodeTree, uids, codeViewInstanceModel });

  // predict needToSelectNodePaths
  return [];
};
const copy = async ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}): Promise<string[]> => {
  return new Promise<string[]>(async (resolve, reject) => {
    try {
      const copiedCode = copyCode({ nodeTree, uids, codeViewInstanceModel });
      await window.navigator.clipboard.writeText(copiedCode);

      // predict needToSelectNodePaths
      resolve([]);
    } catch (err) {
      LogAllow && console.error("Error writing to clipboard:", err);
      reject(err);
    }
  });
};
const paste = async ({
  nodeTree,
  focusedItem,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  codeViewInstanceModel: editor.ITextModel;
}): Promise<string[]> => {
  return new Promise<string[]>(async (resolve, reject) => {
    try {
      const code = await window.navigator.clipboard.readText();
      pasteCode({
        nodeTree,
        focusedItem,
        codeViewInstanceModel,
        code,
      });

      // predict needToSelectNodePaths
      const needToSelectNodePaths: string[] = [];
      resolve(needToSelectNodePaths);
    } catch (err) {
      LogAllow && console.error("Error reading from clipboard:", err);
      reject(err);
    }
  });
};

const duplicate = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}): string[] => {
  const sortedUids = sortUidsByMaxEndIndex(uids, nodeTree);
  sortedUids.forEach((uid) => {
    const node = nodeTree[uid];
    if (node) {
      const { startCol, startLine, endCol, endLine } =
        node.data.sourceCodeLocation;
      const text = codeViewInstanceModel.getValueInRange(
        new Range(startLine, startCol, endLine, endCol),
      );
      const edit = {
        range: new Range(endLine, endCol, endLine, endCol),
        text,
      };
      codeViewInstanceModel.applyEdits([edit]);
    }
  });

  // predict needToSelectNodePaths
  const needToSelectNodePaths = (() => {
    const needToSelectNodePaths: string[] = [];
    const validNodeTree = getValidNodeTree(nodeTree);
    const sortedUids = sortUidsByMinStartIndex(uids, validNodeTree);
    const addedChildCount: { [uid: TNodeUid]: number } = {};
    sortedUids.map((uid) => {
      const node = validNodeTree[uid];
      const parentNode = validNodeTree[node.parentUid as TNodeUid];
      const nodeChildeIndex = getNodeChildIndex(parentNode, node);

      addedChildCount[node.parentUid as TNodeUid] =
        (addedChildCount[node.parentUid as TNodeUid] || 0) + 1;
      const newNodePath = `${parentNode.data.path}${NodePathSplitter}${
        node.data.tagName
      }-${nodeChildeIndex + addedChildCount[node.parentUid as TNodeUid]}`;
      needToSelectNodePaths.push(newNodePath);
    });
    return needToSelectNodePaths;
  })();
  return needToSelectNodePaths;
};
const move = ({
  nodeTree,
  uids,
  targetUid,
  isBetween,
  position,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  targetUid: TNodeUid;
  isBetween: boolean;
  position: number;
  codeViewInstanceModel: editor.ITextModel;
}): string[] => {
  const targetNode = nodeTree[targetUid];
  const childCount = targetNode.children.length;
  const focusedItem = isBetween
    ? targetNode.children[Math.min(childCount - 1, position)]
    : targetNode.children[childCount - 1];
  const sortedUids = sortUidsByMaxEndIndex([...uids, focusedItem], nodeTree);

  const code = copyCode({ nodeTree, uids, codeViewInstanceModel });

  let isFirst = true; // isFirst is used to when drop focusedItem to itself
  sortedUids.map((uid) => {
    if (uid === focusedItem && isFirst) {
      isFirst = false;
      pasteCode({
        nodeTree,
        focusedItem,
        addToBefore: isBetween && position === 0,
        codeViewInstanceModel,
        code,
      });
    } else {
      remove({ nodeTree, uids: [uid], codeViewInstanceModel });
    }
  });

  // predict needToSelectNodePaths
  const needToSelectNodePaths = (() => {
    const needToSelectNodePaths: string[] = [];
    const validNodeTree = getValidNodeTree(nodeTree);
    const targetNode = validNodeTree[targetUid];

    let directChildCount = 0;
    uids.map((uid) => {
      const node = validNodeTree[uid];
      if (node.parentUid === targetUid) {
        const nodeChildeIndex = getNodeChildIndex(targetNode, node);
        isBetween
          ? nodeChildeIndex < position
            ? directChildCount++
            : null
          : directChildCount++;
      }
    });

    uids.map((uid, index) => {
      const node = validNodeTree[uid];
      const newNodeChildIndex =
        (isBetween ? position : targetNode.children.length) -
        directChildCount +
        index;
      const newNodePath = `${targetNode.data.path}${NodePathSplitter}${node.data.tagName}-${newNodeChildIndex}`;
      needToSelectNodePaths.push(newNodePath);
    });
    return needToSelectNodePaths;
  })();
  return needToSelectNodePaths;
};

const rename = ({
  actionName,
  referenceData,
  nodeTree,
  focusedItem,
  codeViewInstanceModel,
}: {
  actionName: string;
  referenceData: THtmlReferenceData;
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  codeViewInstanceModel: editor.ITextModel;
}): string[] => {
  const tagName = actionName.slice(
    RenameNodeActionPrefix.length + 2,
    actionName.length - 1,
  );
  const htmlReferenceData = referenceData as THtmlReferenceData;
  const HTMLElement = htmlReferenceData.elements[tagName];

  let openingTag = HTMLElement.Tag;
  if (HTMLElement.Attributes) {
    const tagArray = openingTag.split("");
    tagArray.splice(tagArray.length - 1, 0, ` ${HTMLElement.Attributes}`);
    openingTag = tagArray.join("");
  }
  const closingTag = `</${tagName}>`;

  const tagContent = !!HTMLElement.Content ? HTMLElement.Content : "";

  // **********************************************************
  // will replace with pureTagCode when we will not want to keep origianl innerHtml of the target node
  // **********************************************************
  const pureTagCode =
    HTMLElement.Contain === "None"
      ? openingTag
      : `${openingTag}${tagContent}${closingTag}`;

  const focusedNode = nodeTree[focusedItem];

  const code = copyCode({
    nodeTree,
    uids: focusedNode.children,
    codeViewInstanceModel,
  });
  const codeToAdd = `${openingTag}${code}${closingTag}`;
  remove({ nodeTree, uids: [focusedItem], codeViewInstanceModel });
  pasteCode({ nodeTree, focusedItem, codeViewInstanceModel, code: codeToAdd });

  // predict needToSelectNodePaths
  const needToSelectNodePaths: string[] = [];
  return needToSelectNodePaths;
};

const group = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}): string[] => {
  const sortedUids = sortUidsByMinStartIndex(uids, nodeTree);
  const code = copyCode({ nodeTree, uids: sortedUids, codeViewInstanceModel });
  remove({ nodeTree, uids, codeViewInstanceModel });

  const { startLine, startCol } =
    nodeTree[sortedUids[0]].data.sourceCodeLocation;
  const edit = {
    range: new Range(startLine, startCol, startLine, startCol),
    text: `<div>${code}</div>`,
  };
  codeViewInstanceModel.applyEdits([edit]);

  // predict needToSelectNodePaths
  const needToSelectNodePaths: string[] = [];
  return needToSelectNodePaths;
};
const ungroup = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}): string[] => {
  const sortedUids = sortUidsByMaxEndIndex(uids, nodeTree);
  sortedUids.map((uid) => {
    const node = nodeTree[uid];
    if (node.children.length === 0) return;

    const { startLine, startCol } = node.data.sourceCodeLocation;
    const code = copyCode({
      nodeTree,
      uids: node.children,
      codeViewInstanceModel,
    });
    remove({ nodeTree, uids: [uid], codeViewInstanceModel });
    const edit = {
      range: new Range(startLine, startCol, startLine, startCol),
      text: code,
    };
    codeViewInstanceModel.applyEdits([edit]);
  });

  // predict needToSelectNodePaths
  const needToSelectNodePaths: string[] = [];
  return needToSelectNodePaths;
};

const edit = ({
  nodeTree,
  focusedItem,
  content,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  content: string;
  codeViewInstanceModel: editor.ITextModel;
}): string[] => {
  replaceContent({ nodeTree, focusedItem, content, codeViewInstanceModel });

  // predict needToSelectNodePaths
  const needToSelectNodePaths: string[] = [];
  return needToSelectNodePaths;
};

export const doNodeActions = async (
  params: TNodeApiPayload,
  fb?: (...params: any[]) => void,
  cb?: (...params: any[]) => void,
) => {
  try {
    const {
      dispatch,

      fileExt = "html",

      actionName,
      referenceData,

      action,
      nodeTree,
      selectedUids,
      targetUid,
      isBetween,
      position,
      content,

      codeViewInstanceModel,
      codeViewTabSize = DefaultTabSize,

      osType = "Windows",
    } = params;

    let needToSelectNodePaths: string[] = [];

    switch (action) {
      case "add":
        needToSelectNodePaths = add({
          actionName,
          referenceData,
          nodeTree,
          focusedItem: targetUid,
          codeViewInstanceModel,
        });
        break;
      case "remove":
        needToSelectNodePaths = remove({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "cut":
        needToSelectNodePaths = cut({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "copy":
        needToSelectNodePaths = await copy({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "paste":
        needToSelectNodePaths = await paste({
          nodeTree,
          focusedItem: targetUid,
          codeViewInstanceModel,
        });
        break;
      case "duplicate":
        needToSelectNodePaths = duplicate({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "move":
        needToSelectNodePaths = move({
          nodeTree,
          uids: selectedUids,
          targetUid,
          isBetween,
          position,
          codeViewInstanceModel,
        });
        break;
      case "rename":
        needToSelectNodePaths = rename({
          actionName,
          referenceData,
          nodeTree,
          focusedItem: targetUid,
          codeViewInstanceModel,
        });
        break;
      case "group":
        needToSelectNodePaths = group({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "ungroup":
        needToSelectNodePaths = ungroup({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "text-edit":
        needToSelectNodePaths = edit({
          nodeTree,
          focusedItem: targetUid,
          content,
          codeViewInstanceModel,
        });
        break;
      default:
        break;
    }

    dispatch(setNeedToSelectNodePaths(needToSelectNodePaths));

    const code = html_beautify(codeViewInstanceModel.getValue());
    codeViewInstanceModel.setValue(code);

    cb && cb();
  } catch (err) {
    LogAllow && console.log(err);
    fb && fb();
  }
};
