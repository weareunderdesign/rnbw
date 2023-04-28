export type CodeViewProps = {
  offsetBottom: number | string,
  offsetLeft: number | string,
  width: number | string,
  height: number | string,
}

export type CursorPos = {
  lineNumber: number,
  column: number,
}

export type CodeSelection = {
  startLineNumber: number,
  startColumn: number,
  endLineNumber: number,
  endColumn: number,
}