import React from "react";

import { SVGIconI } from "@src/components";
import { THtmlElementsReference } from "@rnbws/rfrncs.design";

const spanStyles: React.CSSProperties = {
  width: "calc(100% - 32px)",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const NodeIcon = ({
  htmlElementReferenceData,
  componentTitle,
}: {
  htmlElementReferenceData: THtmlElementsReference;
  componentTitle?: React.ReactNode;
}) => {
  let icon = "component";
  let name = componentTitle;
  if (htmlElementReferenceData) {
    icon = htmlElementReferenceData["Icon"];
    name = htmlElementReferenceData["Name"];
  }

  return (
    <>
      <div className="icon-xs">
        <SVGIconI {...{ class: "icon-xs" }}>raincons/{icon} </SVGIconI>
      </div>
      <span className="text-s justify-stretch" style={spanStyles}>
        {name}
      </span>
    </>
  );
};
