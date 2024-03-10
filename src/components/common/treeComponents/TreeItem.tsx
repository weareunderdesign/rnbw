import React from "react";
import cx from "classnames";
import { TreeItemProps } from "./types";

export const TreeItem = (props: TreeItemProps) => {
  const { context, children, depth, arrow, eventHandlers, key, id, nodeIcon } =
    props;

  return (
    <li
      className={cx(
        context.isSelected && "background-secondary",
        context.isDraggingOver && "",
        context.isDraggingOverParent && "",
        context.isFocused && "",
      )}
      {...context.itemContainerWithChildrenProps}
    >
      <div
        key={key}
        id={id}
        className={cx(
          "justify-stretch",
          "padding-xs",
          "outline-default",

          context.isSelected && "background-tertiary outline-none",
          !context.isSelected && context.isFocused && "outline",
          context.isDraggingOver && "outline",
          context.isDraggingOverParent && "",
        )}
        style={{
          flexWrap: "nowrap",
          paddingLeft: `${depth * 18}px`,
        }}
        {...context.itemContainerWithoutChildrenProps}
        {...context.interactiveElementProps}
        {...eventHandlers}
      >
        <div
          className="gap-s padding-xs"
          style={{ width: "100%" }}
          //   style={{ width: "fit-content" }}
        >
          {arrow}

          {nodeIcon}
        </div>
      </div>

      {context.isExpanded ? <div>{children}</div> : null}
    </li>
  );
};
