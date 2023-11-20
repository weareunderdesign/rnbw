import { editor, Range } from "monaco-editor";
import { TNodeApiPayload, TNodeTreeData, TNodeUid } from "..";
import { html_beautify } from "js-beautify";
import {
  getCopiedContent,
  sortUidsByMaxEndIndex,
} from "@_components/main/actionsPanel/nodeTreeView/helpers";

const create = () => {};

const remove = (
  tree: TNodeTreeData,
  uids: TNodeUid[],
  codeViewInstanceModel: editor.ITextModel,
) => {
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
  // setIsContentProgrammaticallyChanged(true);
  let content = model.getValue();

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

    content = html_beautify(model.getValue());
    model.setValue(content);
  });

  // handleEditorChange(content);
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

export const doNodeActions = (
  params: TNodeApiPayload,
  cb?: (...params: any[]) => void,
) => {
  const { action, selectedUids } = params;
  let codeViewInstanceModel = null;
  let tree = null;
  if (!(action in ["copy"])) {
    codeViewInstanceModel = params.codeViewInstance?.getModel();
    tree = params.tree;
  }

  switch (action) {
    case "create":
      create();
      break;
    case "remove":
      if (!codeViewInstanceModel || !tree) {
        return;
      }
      const cb_params = remove(tree, selectedUids, codeViewInstanceModel);
      // cb && cb(cb_params);
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
    default:
      break;
  }
};
