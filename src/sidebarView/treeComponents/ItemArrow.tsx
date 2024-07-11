import React from "react";

import { SVGIconI, SVGIconII } from "@src/components";
import { ItemArrowProps } from "./types";

export const ItemArrow = React.memo(
  ({ item, context, onClick }: ItemArrowProps) => {
    return (
      <>
        {item.isFolder ? (
          <div className="icon-xs">
            {context.isExpanded ? (
              <SVGIconI
                {...{
                  class: "icon-xs",
                  onClick,
                }}
              >
                raincons/down
              </SVGIconI>
            ) : (
              <SVGIconII
                {...{
                  class: "icon-xs",
                  onClick,
                }}
              >
                raincons/right
              </SVGIconII>
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
