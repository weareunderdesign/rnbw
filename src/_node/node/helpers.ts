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
  firstNesting = false,
}: {
  nodeTree: TNodeTreeData;
  focusedItem: TNodeUid;
  addToBefore?: boolean;
  codeViewInstanceModel: editor.ITextModel;
  code: string;
  firstNesting?: boolean;
}) => {
  const focusedNode = nodeTree[focusedItem];
  const { startLine, startCol, endLine, endCol } =
    focusedNode.data.sourceCodeLocation;
  const tagLength = focusedNode.displayName.length + 3;

  const edit = {
    range: new Range(
      addToBefore ? startLine : endLine,
      addToBefore ? startCol : firstNesting ? endCol - tagLength : endCol,
      addToBefore ? startLine : endLine,
      addToBefore ? startCol : firstNesting ? endCol - tagLength : endCol,
    ),
    text: code,
  };
  codeViewInstanceModel.applyEdits([edit]);
};
