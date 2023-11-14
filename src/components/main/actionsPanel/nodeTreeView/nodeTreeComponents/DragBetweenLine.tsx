import React, { FC } from "react";

import { DraggingPosition } from "react-complex-tree";

interface DragBetweenLine {
  draggingPosition: DraggingPosition;
  lineProps: React.HTMLProps<any>;
}

export const DragBetweenLine: FC<DragBetweenLine> = React.memo(
  ({ draggingPosition, lineProps }) => {
    return (
      <div
        {...lineProps}
        className={"foreground-tertiary"}
        style={{
          position: "absolute",
          right: "0",
          top:
            draggingPosition.targetType === "between-items" &&
            draggingPosition.linePosition === "top"
              ? "0px"
              : draggingPosition.targetType === "between-items" &&
                draggingPosition.linePosition === "bottom"
              ? "-2px"
              : "-2px",
          left: `${draggingPosition.depth * 10 + 20}px`,
          height: "2px",
        }}
      />
    );
  },
);
