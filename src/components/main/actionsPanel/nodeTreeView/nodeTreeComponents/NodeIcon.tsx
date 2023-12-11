import React from "react";

import { SVGIconI } from "@_components/common";
import { THtmlElementsReference } from "@_types/main";

const spanStyles: React.CSSProperties = {
  width: "calc(100% - 32px)",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
};

export const NodeIcon = ({
  htmlElementReferenceData,
  nodeName,
  componentTitle,
}: {
  htmlElementReferenceData: THtmlElementsReference;
  nodeName: string;
  componentTitle?: React.ReactNode;
}) => {
  let icon = "component";
  let name = componentTitle;
  if (htmlElementReferenceData) {
    icon = htmlElementReferenceData["Icon"];
    name = htmlElementReferenceData["Name"];
  } else if (nodeName === "!--...--" || nodeName === "comment") {
    icon = "bubble";
    name = "comment";
  }

  return (
    <>
      <div className="icon-xs">
        <SVGIconI {...{ class: "icon-xs" }}>{icon} </SVGIconI>
      </div>
      <span className="text-s justify-stretch" style={spanStyles}>
        {name}
      </span>
    </>
  );
};
