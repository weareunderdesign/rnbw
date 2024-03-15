/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from "react";

import { SVGIconI, SVGIconII } from "@_components/common";
import { ItemArrowProps } from "./types";

export const ItemArrow: FC<ItemArrowProps> = React.memo(
  ({ item, context, onClick }) => {
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
