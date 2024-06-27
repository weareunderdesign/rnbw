/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { DraggingPosition, DraggingPositionItem } from "react-complex-tree";

interface DragBetweenLine {
  draggingPosition: DraggingPosition;
  lineProps: React.HTMLProps<any>;
}

export const DragBetweenLine = React.memo(
  ({ draggingPosition, lineProps }: DragBetweenLine) => {
    const parentUid = (draggingPosition as DraggingPositionItem).parentItem;

    useEffect(() => {
      const newParentElement = document.querySelector(
        `#NodeTreeView-${parentUid}`
      ) as HTMLElement | null;

      if (newParentElement) {
        newParentElement.style.outlineWidth = '1px';
        newParentElement.style.outlineStyle = 'solid';
        newParentElement.style.outlineOffset = '-1px';
      }

      return () => {
        if (newParentElement) {
          newParentElement.style.removeProperty('outline-width');
          newParentElement.style.removeProperty('outline-style');
          newParentElement.style.removeProperty('outline-offset');
        }
      };
    }, [parentUid]);

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
  }
);

DragBetweenLine.displayName = "DragBetweenLine";