import React, { FC } from "react";

interface ItemTitleProps {
  title: string;
}

export const ItemTitle: FC<ItemTitleProps> = React.memo(({ title }) => {
  return (
    <span
      className="text-s justify-stretch"
      style={{
        width: "100%",
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {title}
    </span>
  );
});
