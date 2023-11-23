import { editor, Range } from "monaco-editor";
import {
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
import { AddNodeActionPrefix, DefaultTabSize } from "@_constants/main";
import { THtmlReferenceData } from "@_types/main";
import { LogAllow } from "@_constants/global";
import { copyCode, pasteCode } from "./helpers";

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
}) => {
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
};
const remove = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}) => {
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
};

const cut = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}) => {
  copy({ nodeTree, uids, codeViewInstanceModel });
  remove({ nodeTree, uids, codeViewInstanceModel });
};
const copy = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}) => {
  const copiedCode = copyCode({ nodeTree, uids, codeViewInstanceModel });
  window.navigator.clipboard.writeText(copiedCode);
};
const paste = async ({
  nodeTree,
  focusedItem,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  codeViewInstanceModel: editor.ITextModel;
}) => {
  await window.navigator.clipboard
    .readText()
    .then((code) => {
      pasteCode({
        nodeTree,
        focusedItem,
        codeViewInstanceModel,
        code,
      });
    })
    .catch((error) => {
      LogAllow && console.error("Error reading from clipboard:", error);
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
}) => {
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
}) => {
  const targetNode = nodeTree[targetUid];
  const focusedItem = isBetween ? targetNode.children[position] : targetUid;
  const sortedUids = sortUidsByMaxEndIndex([...uids, focusedItem], nodeTree);

  const code = copyCode({ nodeTree, uids, codeViewInstanceModel });
  sortedUids.map((uid) => {
    uid === focusedItem
      ? pasteCode({ nodeTree, focusedItem, codeViewInstanceModel, code })
      : remove({ nodeTree, uids: [uid], codeViewInstanceModel });
  });
};

const rename = () => {};

const group = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}) => {
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
};
const ungroup = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}) => {
  const sortedUids = sortUidsByMaxEndIndex(uids, nodeTree);
  sortedUids.map((uid) => {
    const node = nodeTree[uid];
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
};

export const doNodeActions = async (
  params: TNodeApiPayload,
  fb?: (...params: any[]) => void,
  cb?: (...params: any[]) => void,
) => {
  try {
    const {
      fileExt = "html",

      actionName,
      referenceData,

      action,
      nodeTree,
      selectedUids,
      targetUid,
      isBetween,
      position,

      codeViewInstanceModel,
      codeViewTabSize = DefaultTabSize,

      osType = "Windows",
    } = params;

    switch (action) {
      case "add":
        add({
          actionName,
          referenceData,
          nodeTree,
          focusedItem: targetUid,
          codeViewInstanceModel,
        });
        break;
      case "remove":
        remove({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "cut":
        cut({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "copy":
        copy({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "paste":
        await paste({
          nodeTree,
          focusedItem: targetUid,
          codeViewInstanceModel,
        });
        break;
      case "duplicate":
        duplicate({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "move":
        move({
          nodeTree,
          uids: selectedUids,
          targetUid,
          isBetween,
          position,
          codeViewInstanceModel,
        });
        break;
      case "rename":
        rename();
        break;
      case "group":
        group({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      case "ungroup":
        ungroup({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        break;
      default:
        break;
    }

    const content = html_beautify(codeViewInstanceModel.getValue());
    codeViewInstanceModel.setValue(content);

    cb && cb();
  } catch (err) {
    LogAllow && console.log(err);
    fb && fb();
  }
};
