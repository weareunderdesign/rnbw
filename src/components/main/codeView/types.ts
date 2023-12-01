export type CodeViewProps = {
  offsetTop: string | number;
  offsetBottom: number | string;
  offsetLeft: number | string;
  width: number | string;
  height: number | string;
  dropCodeView: (e: React.DragEvent<HTMLDivElement>) => void;
  dragCodeView: (e: React.DragEvent<HTMLDivElement>) => void;
  dragEndCodeView: (e: React.DragEvent<HTMLDivElement>) => void;
  codeViewDragging: boolean;
};

export type TCodeSelection = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
};
