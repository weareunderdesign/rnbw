import React, { FC } from "react";

import { TreeItem, TreeItemRenderContext } from "react-complex-tree";

import { SVGIconI, SVGIconII } from "@_components/common";

interface ItemArrowProps {
  item: TreeItem<any>;
  context: TreeItemRenderContext<never>;
}

export const ItemArrow: FC<ItemArrowProps> = React.memo(({ item, context }) => {
  return (
    <>
      {item.isFolder ? (
        context.isExpanded ? (
          <SVGIconI {...{ class: "icon-xs" }}>down</SVGIconI>
        ) : (
          <SVGIconII {...{ class: "icon-xs" }}>right</SVGIconII>
        )
      ) : (
        <div className="icon-xs"></div>
      )}
    </>
  );
});
