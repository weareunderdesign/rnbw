import React, { FC } from "react";
import { SVGIconI } from "@_components/common";
import { TFilesReference } from "@_types/main";
import { TreeItem } from "react-complex-tree";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface NodeIconProps<T = any> {
  fileReferenceData: TFilesReference;
  item: TreeItem<T>;
}
export const NodeIcon: FC<NodeIconProps> = ({ fileReferenceData, item }) => {
  if (fileReferenceData) {
    return (
      <div className="icon-xs">
        <SVGIconI {...{ class: "icon-xs" }}>
          {item.data?.data.kind === "file" &&
          item.data?.data.name === "index" &&
          item.data?.data.type === "html" &&
          item.data?.parentUid === "ROOT"
            ? "home"
            : fileReferenceData &&
                fileReferenceData["Icon"] &&
                fileReferenceData["Icon"] !== "md"
              ? fileReferenceData["Icon"]
              : "page"}
        </SVGIconI>
      </div>
    );
  }

  return (
    <div className="icon-xs">
      <SVGIconI {...{ class: "icon-xs" }}>
        {item.data?.isEntity ? "page" : "folder"}
      </SVGIconI>
    </div>
  );
};
