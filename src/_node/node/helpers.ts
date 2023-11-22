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
      const { startCol, startLine, endCol, endLine } =
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
  codeViewInstanceModel,
  code,
}: {
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  codeViewInstanceModel: editor.ITextModel;
  code: string;
}) => {
  const focusedNode = nodeTree[focusedItem];
  const { endLine, endCol } = focusedNode.data.sourceCodeLocation;
  const edit = {
    range: new Range(endLine, endCol + 1, endLine, endCol + 1),
    text: code,
  };
  codeViewInstanceModel.applyEdits([edit]);
};
