import { editor, Range } from "monaco-editor";
import { TNodeApiPayload, TNodeTreeData, TNodeUid } from "..";
import { html_beautify } from "js-beautify";

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

const duplicate = () => {};
const move = () => {};
const copy = () => {};

export const doNodeActions = (
  params: TNodeApiPayload,
  cb?: (...params: any[]) => void,
) => {
  const {
    tree,
    fileExt = "",

    action,

    selectedUids,
    isBetween = false,
    position = 0,

    codeViewInstance,
    codeViewInstanceModel,
    codeViewTabSize = 2,

    osType = "Windows",
  } = params;

  switch (action) {
    case "create":
      create();
      break;
    case "remove":
      const cb_params = remove(
        tree,
        selectedUids,
        codeViewInstanceModel as editor.ITextModel,
      );
      // cb && cb(cb_params);
      break;
    case "duplicate":
      duplicate();
      break;
    case "move":
      move();
      break;
    case "copy":
      copy();
      break;
    default:
      break;
  }
};
