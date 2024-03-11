/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import React, { FC } from "react";
import { ItemTitleProps } from "./types";

export const ItemTitle: FC<ItemTitleProps> = React.memo(
  ({ title, isChanged = false }) => {
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
