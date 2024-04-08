import { editor, Range } from "monaco-editor";

import { TNodeTreeData, TNodeUid } from "../";

export const copyCode = ({
  validNodeTree,
  uids,
  codeViewInstanceModel,
}: {
  validNodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}): string => {
  let copiedCode = "";
  uids.forEach((uid) => {
    const node = validNodeTree[uid];
    if (node) {
      const { startLine, startCol, endLine, endCol } =
        node.data.sourceCodeLocation;
      const text = codeViewInstanceModel.getValueInRange(
        new Range(startLine, startCol, endLine, endCol),
      );
      copiedCode += text;
    }
  });
  return copiedCode;
};

export const pasteCode = ({
  validNodeTree,
  focusedItem,
  addToBefore = false,
  codeViewInstanceModel,
  code,
}: {
  validNodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  addToBefore?: boolean;
  codeViewInstanceModel: editor.ITextModel;
  code: string;
}) => {
  const focusedNode = validNodeTree[focusedItem];
  const { startLine, startCol, endLine, endCol } =
    focusedNode.data.sourceCodeLocation;
  const edit = {
    range: new Range(
      addToBefore ? startLine : endLine,
      addToBefore ? startCol : endCol,
      addToBefore ? startLine : endLine,
      addToBefore ? startCol : endCol,
    ),
    text: code,
  };
  codeViewInstanceModel.applyEdits([edit]);
};

export const pasteCodeInsideEmpty = ({
  validNodeTree,
  focusedItem,
  codeViewInstanceModel,
  code,
}: {
  validNodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  addToBefore?: boolean;
  codeViewInstanceModel: editor.ITextModel;
  code: string;
}) => {
  const focusedNode = validNodeTree[focusedItem];
  const { startTag } = focusedNode.data.sourceCodeLocation;
  const edit = {
    range: new Range(
      startTag.endLine,
      startTag.endCol,
      startTag.endLine,
      startTag.endCol,
    ),
    text: code,
  };
  codeViewInstanceModel.applyEdits([edit]);
};

export const replaceContent = ({
  nodeTree,
  focusedItem,
  content,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  content: string;
  codeViewInstanceModel: editor.ITextModel;
}) => {
  const focusedNode = nodeTree[focusedItem];
  const { startTag, endTag, startLine, endLine, startCol, endCol } =
    focusedNode.data.sourceCodeLocation;
  if (startTag && endTag) {
    const edit = {
      range: new Range(
        startTag.endLine,
        startTag.endCol,
        endTag.startLine,
        endTag.startCol,
      ),
      text: content,
    };
    codeViewInstanceModel.applyEdits([edit]);
  } else if (startLine && endLine && startCol && endCol) {
    const edit = {
      range: new Range(startLine, startCol, endLine, endCol),
      text: content,
    };
    codeViewInstanceModel.applyEdits([edit]);
  }
};
