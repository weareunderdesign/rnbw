import { editor, Range } from "monaco-editor";
import {
  StageNodeIdAttr,
  TNodeApiPayload,
  TNodeReferenceData,
  TNodeTreeData,
  TNodeUid,
} from "..";
import { html_beautify } from "js-beautify";
import {
  getCopiedContent,
  sortUidsByMaxEndIndex,
  sortUidsByMinStartIndex,
} from "@_components/main/actionsPanel/nodeTreeView/helpers";
import { AddNodeActionPrefix, DefaultTabSize } from "@_constants/main";
import { THtmlReferenceData } from "@_types/main";
import { LogAllow } from "@_constants/global";

const add = ({
  actionName,
  referenceData,
  nodeTree,
  focusedItem,
  codeViewInstance,
  codeViewInstanceModel,
}: {
  actionName: string;
  referenceData: TNodeReferenceData;
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  codeViewInstance: editor.IStandaloneCodeEditor;
  codeViewInstanceModel: editor.ITextModel;
}) => {
  const focusedNode = nodeTree[focusedItem];
  if (!focusedNode?.uid) throw "Focused node is undefined";

  const selectedNode = nodeTree[focusedNode.uid];
  if (!selectedNode || !selectedNode.data.sourceCodeLocation)
    throw "Parent node or source code location is undefined";

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

  const { endLine, endCol } = selectedNode.data.sourceCodeLocation;
  const position = { lineNumber: endLine, column: endCol + 1 };
  const range = new Range(
    position.lineNumber,
    position.column,
    position.lineNumber,
    position.column,
  );
  const editOperation = { range, text: codeViewText };

  codeViewInstanceModel.pushEditOperations([], [editOperation], () => null);
  codeViewInstance.setPosition({
    lineNumber: position.lineNumber + 1,
    column: 1,
  });

  const content = html_beautify(codeViewInstanceModel.getValue());
  codeViewInstanceModel.setValue(content);
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
  uids.forEach((uid) => {
    const node = nodeTree[uid];
    if (node) {
      const {
        endCol: endColumn,
        endLine: endLineNumber,
        startCol: startColumn,
        startLine: startLineNumber,
      } = node.data.sourceCodeLocation;

      const edit = {
        range: new Range(
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn,
        ),
        text: "",
      };
      codeViewInstanceModel.applyEdits([edit]);
    }
  });

  const content = html_beautify(codeViewInstanceModel.getValue());
  codeViewInstanceModel.setValue(content);

  return [
    content,
    {
      matchIds: uids,
    },
  ];
};

const cut = ({
  nodeTree,
  uids,
  codeViewInstance,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstance: editor.IStandaloneCodeEditor;
  codeViewInstanceModel: editor.ITextModel;
}) => {
  copy({ nodeTree, uids, codeViewInstance, codeViewInstanceModel });
  remove({ nodeTree, uids, codeViewInstanceModel });
};
const copy = ({
  nodeTree,
  uids,
  codeViewInstance,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstance: editor.IStandaloneCodeEditor;
  codeViewInstanceModel: editor.ITextModel;
}) => {
  const iframe: any = document.getElementById("iframeId");
  let copiedCode = "";

  uids.forEach((uid) => {
    const cleanedUpCode = getCopiedContent(uid, iframe);

    if (!cleanedUpCode) return;

    copiedCode += cleanedUpCode;
  });
  //copy the cleaned up code to clipboard
  window.navigator.clipboard.writeText(copiedCode);
};
const paste = ({
  validNodeTree,
  focusedItem,
  codeViewInstance,
  codeViewInstanceModel,
}: {
  validNodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  codeViewInstance: editor.IStandaloneCodeEditor;
  codeViewInstanceModel: editor.ITextModel;
}) => {
  const focusedNode = validNodeTree[focusedItem];
  const { endLine, endCol } = focusedNode.data.sourceCodeLocation;

  window.navigator.clipboard
    .readText()
    .then((copiedCode) => {
      const position = { lineNumber: endLine, column: endCol + 1 };
      const range = new Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column,
      );
      const editOperation = { range, text: copiedCode };

      codeViewInstanceModel.pushEditOperations([], [editOperation], () => null);
      codeViewInstance.setPosition({
        lineNumber: position.lineNumber + 1,
        column: 1,
      });
      const content = html_beautify(codeViewInstanceModel.getValue());
      codeViewInstanceModel.setValue(content);
    })
    .catch((error) => {
      LogAllow && console.error("Error reading from clipboard:", error);
    });
};

const duplicate = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
  codeViewInstance,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
  codeViewInstance: editor.IStandaloneCodeEditor;
}) => {
  const iframe: any = document.getElementById("iframeId");

  const sortedUids = sortUidsByMaxEndIndex(uids, nodeTree);

  sortedUids.forEach((uid) => {
    const cleanedUpCode = getCopiedContent(uid, iframe);

    if (!cleanedUpCode) return;

    const selectedNode = nodeTree[uid];
    if (!selectedNode || !selectedNode.data.sourceCodeLocation) {
      return;
    }
    const { endLine, endCol } = selectedNode.data.sourceCodeLocation;

    const position = { lineNumber: endLine, column: endCol + 1 };

    const range = new Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    );
    const editOperation = { range, text: cleanedUpCode };

    codeViewInstanceModel.pushEditOperations([], [editOperation], () => null);
    codeViewInstance?.setPosition({
      lineNumber: position.lineNumber + 1,
      column: 1,
    });

    const content = html_beautify(codeViewInstanceModel.getValue());
    codeViewInstanceModel.setValue(content);
  });
};
const move = ({
  nodeTree,
  uids,
  targetUid,
  isBetween,
  position,
  codeViewInstance,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  targetUid: TNodeUid;
  isBetween: boolean;
  position: number;
  codeViewInstance: editor.IStandaloneCodeEditor;
  codeViewInstanceModel: editor.ITextModel;
}) => {};

const rename = () => {};

const group = ({
  validNodeTree,
  uids,
  codeViewInstance,
  codeViewInstanceModel,
}: {
  validNodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstance: editor.IStandaloneCodeEditor;
  codeViewInstanceModel: editor.ITextModel;
}) => {
  const iframe: any = document.getElementById("iframeId");
  let copiedCode = "";

  const sortedUids = sortUidsByMinStartIndex(uids, validNodeTree);

  sortedUids.forEach((uid) => {
    const cleanedUpCode = getCopiedContent(uid, iframe);

    if (!cleanedUpCode) return;

    copiedCode += cleanedUpCode + "\n";
  });

  const { startLine, startCol } =
    validNodeTree[sortedUids[0]].data.sourceCodeLocation;

  let focusLineNumber = 0;
  let parentUids = [] as TNodeUid[];

  uids.forEach((uid) => {
    let node = validNodeTree[uid];

    if (node) {
      let parentUid = node.parentUid;
      if (parentUid) {
        parentUids.push(parentUid);
      }
      const {
        endCol: endColumn,
        endLine: endLineNumber,
        startCol: startColumn,
        startLine: startLineNumber,
      } = node.data.sourceCodeLocation;

      const range = new Range(
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      );
      let edit = {
        range: range,
        text: "",
      };
      codeViewInstanceModel.applyEdits([edit]);
      focusLineNumber = startLineNumber;
    }
  });

  const position = { lineNumber: startLine, column: startCol };
  const range = new Range(
    position.lineNumber,
    position.column,
    position.lineNumber,
    position.column,
  );
  const editOperation = {
    range,
    text: `<div>${copiedCode}</div>`,
  };

  codeViewInstanceModel.pushEditOperations([], [editOperation], () => null);
  codeViewInstance.setPosition({
    lineNumber: position.lineNumber + 1,
    column: 1,
  });

  const content = html_beautify(codeViewInstanceModel.getValue());
  codeViewInstanceModel.setValue(content);

  return [
    content,
    {
      matchIds: uids,
    },
  ];
};
const ungroup = ({
  validNodeTree,
  uids,
  codeViewInstance,
  codeViewInstanceModel,
}: {
  validNodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstance: editor.IStandaloneCodeEditor;
  codeViewInstanceModel: editor.ITextModel;
}) => {
  const iframe: any = document.getElementById("iframeId");

  const sortedUids = sortUidsByMaxEndIndex(uids, validNodeTree);

  sortedUids.forEach((uid) => {
    // const cleanedUpCode = getCopiedContent(uid, iframe);

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
    const cleanedUpCode = eleCopy?.innerHTML;

    //delete the copy
    eleCopy?.remove();

    if (!cleanedUpCode) return;

    const selectedNode = validNodeTree[uid];
    const selectedNodeChildren = selectedNode.children.length;

    if (!selectedNodeChildren) return;

    if (!selectedNode || !selectedNode.data.sourceCodeLocation) {
      console.error("Parent node or source code location is undefined");
      return;
    }

    let parentUids = [] as TNodeUid[];

    let parentUid = selectedNode.parentUid;

    if (parentUid) {
      parentUids.push(parentUid);
    }
    const {
      endCol: endColumn,
      endLine: endLineNumber,
      startCol: startColumn,
      startLine: startLineNumber,
    } = selectedNode.data.sourceCodeLocation;

    const range = new Range(
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    );

    let edit = {
      range: range,
      text: "",
    };
    codeViewInstanceModel.applyEdits([edit]);

    const newRange = new Range(
      startLineNumber,
      startColumn,
      startLineNumber,
      startColumn,
    );

    const editOperation = { range: newRange, text: cleanedUpCode };

    codeViewInstanceModel.pushEditOperations([], [editOperation], () => null);
    codeViewInstance.setPosition({
      lineNumber: startLineNumber + 1,
      column: 1,
    });

    const content = html_beautify(codeViewInstanceModel.getValue());
    codeViewInstanceModel.setValue(content);
  });
};

export const doNodeActions = (
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
      validNodeTree,
      selectedUids,
      targetUid,
      isBetween,
      position,

      codeViewInstance,
      codeViewInstanceModel,
      codeViewTabSize = DefaultTabSize,

      osType = "Windows",
    } = params;
    let cb_params: any[];

    switch (action) {
      case "add":
        add({
          actionName,
          referenceData,
          nodeTree,
          focusedItem: targetUid,
          codeViewInstance,
          codeViewInstanceModel,
        });
        break;
      case "remove":
        cb_params = remove({
          nodeTree,
          uids: selectedUids,
          codeViewInstanceModel,
        });
        cb && cb(cb_params);
        break;
      case "cut":
        cut({
          nodeTree,
          uids: selectedUids,
          codeViewInstance,
          codeViewInstanceModel,
        });
        break;
      case "copy":
        copy({
          nodeTree,
          uids: selectedUids,
          codeViewInstance,
          codeViewInstanceModel,
        });
        break;
      case "paste":
        paste({
          validNodeTree,
          focusedItem: targetUid,
          codeViewInstance,
          codeViewInstanceModel,
        });
        break;
      case "duplicate":
        duplicate({
          nodeTree,
          uids: selectedUids,
          codeViewInstance,
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
          codeViewInstance,
          codeViewInstanceModel,
        });
        break;
      case "rename":
        rename();
        break;
      case "group":
        cb_params = group({
          validNodeTree,
          uids: selectedUids,
          codeViewInstance,
          codeViewInstanceModel,
        });
        cb && cb(cb_params);
        break;
      case "ungroup":
        ungroup({
          validNodeTree,
          uids: selectedUids,
          codeViewInstance,
          codeViewInstanceModel,
        });
        break;
      default:
        break;
    }
  } catch (err) {
    LogAllow && console.log(err);
    fb && fb();
  }
};
