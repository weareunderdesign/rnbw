import React from "react";

import { SVGIcon } from "@src/components";
import { ItemArrowProps } from "./types";

export const ItemArrow = React.memo(
  ({ item, context, onClick }: ItemArrowProps) => {
    return (
      <>
        {item.isFolder ? (
          <div className="icon-xs">
            {context.isExpanded ? (
              <SVGIcon name="down" className="icon-xs" onClick={onClick} />
            ) : (
              <SVGIcon name="right" className="icon-xs" onClick={onClick} />
            )}
          </div>
        ) : (
          <div className="icon-xs">
            <div style={{ height: "12px", width: "12px" }} />
          </div>
        )}
      </>
    );
  },
);

ItemArrow.displayName = "ItemArrow";
