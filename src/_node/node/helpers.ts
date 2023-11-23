import { editor, Range } from "monaco-editor";
import { TNodeTreeData, TNodeUid } from "..";

export const copyCode = ({
  nodeTree,
  uids,
  codeViewInstanceModel,
}: {
  nodeTree: TNodeTreeData;
  uids: TNodeUid[];
  codeViewInstanceModel: editor.ITextModel;
}): string => {
  let copiedCode = "";
  uids.forEach((uid) => {
    const node = nodeTree[uid];
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
  nodeTree,
  focusedItem,
  addToBefore = false,
  codeViewInstanceModel,
  code,
}: {
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  addToBefore?: boolean;
  codeViewInstanceModel: editor.ITextModel;
  code: string;
}) => {
  const focusedNode = nodeTree[focusedItem];
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
