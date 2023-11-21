import { editor, Range } from "monaco-editor";
import { TNodeApiPayload, TNodeTreeData, TNodeUid } from "..";
import { html_beautify } from "js-beautify";
import {
  getCopiedContent,
  sortUidsByMaxEndIndex,
} from "@_components/main/actionsPanel/nodeTreeView/helpers";
import { AddNodeActionPrefix } from "@_constants/main";
import { THtmlReferenceData } from "@_types/main";
import { LogAllow } from "@_constants/global";

const create = ({
  actionName,
  focusedItem,
  tree,
  codeViewInstance,
  htmlReferenceData,
}: {
  actionName: string;
  focusedItem: string;
  tree: TNodeTreeData;
  codeViewInstance: editor.IStandaloneCodeEditor;
  htmlReferenceData: THtmlReferenceData;
}) => {
  const tagName = actionName.slice(
    AddNodeActionPrefix.length + 2,
    actionName.length - 1,
  );
  const focusedNode = tree[focusedItem];

  if (!focusedNode?.uid) {
    console.error("Focused node is undefined");
    return;
  }
  const selectedNode = tree[focusedNode.uid];
  if (!selectedNode || !selectedNode.data.sourceCodeLocation) {
    console.error("Parent node or source code location is undefined");
    return;
  }
  const { endLine, endCol } = selectedNode.data.sourceCodeLocation;
  const model = codeViewInstance.getModel();
  if (!model) {
    console.error("Monaco Editor model is undefined");
    return;
  }
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

  const position = { lineNumber: endLine, column: endCol + 1 };
  const range = new Range(
    position.lineNumber,
    position.column,
    position.lineNumber,
    position.column,
  );
  const editOperation = { range, text: codeViewText };

  model.pushEditOperations([], [editOperation], () => null);
  codeViewInstance.setPosition({
    lineNumber: position.lineNumber + 1,
    column: 1,
  });
};

const remove = ({
  tree,
  uids,
  codeViewInstanceModel,
}: {
  tree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}) => {
  uids.forEach((uid) => {
    const node = tree[uid];
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

const duplicate = ({
  uids,
  tree,
  model,
  codeViewInstance,
}: {
  uids: TNodeUid[];
  tree: TNodeTreeData;
  model: editor.ITextModel;
  codeViewInstance: editor.IStandaloneCodeEditor;
}) => {
  const iframe: any = document.getElementById("iframeId");

  if (!model) {
    return;
  }

  const sortedUids = sortUidsByMaxEndIndex(uids, tree);

  sortedUids.forEach((uid) => {
    const cleanedUpCode = getCopiedContent(uid, iframe);

    if (!cleanedUpCode) return;

    const selectedNode = tree[uid];
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

    model.pushEditOperations([], [editOperation], () => null);
    codeViewInstance?.setPosition({
      lineNumber: position.lineNumber + 1,
      column: 1,
    });
  });
};

const move = () => {};

const copy = ({ uids }: { uids: TNodeUid[] }) => {
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
  focusedItem,
  tree,
  codeViewInstance,
}: {
  focusedItem: string;
  tree: TNodeTreeData;
  codeViewInstance: editor.IStandaloneCodeEditor;
}) => {
  const focusedNode = tree[focusedItem];
  if (!focusedNode || !focusedNode.data.sourceCodeLocation) {
    LogAllow &&
      console.error("Focused node or its source code location is undefined");
    return;
  }
  const model = codeViewInstance?.getModel();
  if (!model) {
    LogAllow && console.error("Monaco Editor model is undefined");
    return;
  }
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

      model.pushEditOperations([], [editOperation], () => null);
      codeViewInstance?.setPosition({
        lineNumber: position.lineNumber + 1,
        column: 1,
      });
    })
    .catch((error) => {
      LogAllow && console.error("Error reading from clipboard:", error);
    });
};

export const doNodeActions = (params: TNodeApiPayload) => {
  const { action, selectedUids } = params;
  let codeViewInstanceModel = null;

  if (!(action in ["copy"])) {
    codeViewInstanceModel = params.codeViewInstance?.getModel();
  }

  switch (action) {
    case "create":
      create({
        actionName: params.actionName,
        focusedItem: params.nodeTreeFocusedItem,
        tree: params.tree,
        codeViewInstance: params.codeViewInstance,
        htmlReferenceData: params.htmlReferenceData,
      });
      break;
    case "remove":
      if (!codeViewInstanceModel) {
        return;
      }
      remove({
        tree: params.tree,
        uids: selectedUids,
        codeViewInstanceModel,
      });

      break;
    case "duplicate":
      if (!codeViewInstanceModel) {
        return;
      }
      duplicate({
        uids: selectedUids,
        model: codeViewInstanceModel,
        codeViewInstance: params.codeViewInstance,
        tree: params.tree,
      });
      break;
    case "move":
      move();
      break;
    case "copy":
      copy({
        uids: selectedUids,
      });
      break;
    case "paste":
      paste({
        focusedItem: params.targetUid,
        tree: params.tree,
        codeViewInstance: params.codeViewInstance,
      });
    default:
      break;
  }
  return codeViewInstanceModel?.getValue() || null;
};
