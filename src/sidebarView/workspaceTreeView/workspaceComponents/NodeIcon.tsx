import React, { FC } from "react";
import { TreeItem } from "react-complex-tree";
import { TFilesReference } from "@rnbws/rfrncs.design";
import { SVGIcon } from "@src/components";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface NodeIconProps<T = any> {
  fileReferenceData: TFilesReference;
  item: TreeItem<T>;
}
export const NodeIcon: FC<NodeIconProps> = ({ fileReferenceData, item }) => {
  if (fileReferenceData) {
    return (
      <div className="icon-xs">
        <SVGIcon
          className="icon-xs"
          name={
            item.data?.data.kind === "file" &&
            item.data?.data.name === "index" &&
            item.data?.data.type === "html" &&
            item.data?.parentUid === "ROOT"
              ? "home"
              : fileReferenceData &&
                  fileReferenceData["Icon"] &&
                  fileReferenceData["Icon"] !== "md"
                ? fileReferenceData["Icon"]
                : "page"
          }
        />
      </div>
    );
  }

  return (
    <div className="icon-xs">
      <SVGIcon name={item.data?.isEntity ? "page" : "folder"} />
    </div>
  );
};
