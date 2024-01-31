import React, { FC, useEffect } from "react";
import { DraggingPosition, DraggingPositionItem } from "react-complex-tree";

import { addClass, removeClass } from "@_services/main";
interface DragBetweenLine {
  draggingPosition: DraggingPosition;
  lineProps: React.HTMLProps<any>;
}

export const DragBetweenLine: FC<DragBetweenLine> = React.memo(
  ({ draggingPosition, lineProps }) => {
    const parentUid = (draggingPosition as DraggingPositionItem).parentItem;

    useEffect(() => {
      const newParentElement = document.querySelector(
        `#NodeTreeView-${parentUid}`,
      );
      newParentElement?.setAttribute(
        "class",
        addClass(newParentElement.getAttribute("class") || "", "outline"),
      );

      return () => {
        newParentElement?.setAttribute(
          "class",
          removeClass(newParentElement.getAttribute("class") || "", "outline"),
        );
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
  },
);
