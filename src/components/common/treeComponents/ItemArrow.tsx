import React, { FC } from "react";

import { SVGIconI, SVGIconII } from "@_components/common";
import { ItemArrowProps } from "./types";

export const ItemArrow: FC<ItemArrowProps> = React.memo(
  ({ item, context, onClick }) => {
    return (
      <>
        {item.isFolder ? (
          context.isExpanded ? (
            <SVGIconI
              {...{
                class: "icon-xs",
                onClick,
              }}
            >
              down
            </SVGIconI>
          ) : (
            <SVGIconII
              {...{
                class: "icon-xs",
                onClick,
              }}
            >
              right
            </SVGIconII>
          )
        ) : (
          <div className="icon-xs" />
        )}
      </>
    );
  },
);
