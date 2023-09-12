import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export const getPositionFromIndex = (
  editor: monaco.editor.IStandaloneCodeEditor,
  startIndex: number,
  endIndex: number,
) => {
  const position = editor.getModel()?.getPositionAt(startIndex as number);

  const startLineNumber = position?.lineNumber as number;
  const startColumn = position?.column as number;

  const endPosition = editor
    .getModel()
    ?.getPositionAt((endIndex as number) + 1);
  const endLineNumber = endPosition?.lineNumber as number;
  const endColumn = endPosition?.column as number;
  return {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  };
};
