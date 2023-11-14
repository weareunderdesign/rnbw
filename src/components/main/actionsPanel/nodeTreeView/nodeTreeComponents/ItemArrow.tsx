import React, { FC, useCallback } from "react";

import { TreeItem, TreeItemRenderContext } from "react-complex-tree";

import { SVGIconI, SVGIconII } from "@_components/common";

interface ItemArrowProps {
  item: TreeItem<any>;
  context: TreeItemRenderContext<never>;
  addRunningActions: (actionNames: string[]) => void;
}

export const ItemArrow: FC<ItemArrowProps> = React.memo(
  ({ item, context, addRunningActions }) => {
    const onClick = useCallback(() => {
      addRunningActions(["nodeTreeView-arrow"]);
      context.toggleExpandedState();
    }, [context]);

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
