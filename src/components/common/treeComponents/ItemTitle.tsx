import React from "react";
import { ItemTitleProps } from "./types";

export const ItemTitle = React.memo(
  ({ title, isChanged = false }: ItemTitleProps) => {
    return (
      <span
        className="justify-start text-s gap-s align-center"
        style={{
          width: "100%",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}

        {isChanged && (
          <div
            className="radius-s foreground-primary"
            title="unsaved file"
            style={{ width: "6px", height: "6px" }}
          />
        )}
      </span>
    );
  },
);
ItemTitle.displayName = "ItemTitle";
