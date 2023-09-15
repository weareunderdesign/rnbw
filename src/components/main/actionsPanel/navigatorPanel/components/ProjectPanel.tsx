import React, { useContext } from "react";

import { SVGIconI } from "@_components/common";
import { MainContext } from "@_redux/main";
import { useNavigatorPanelHandlers } from "../hooks";

export const ProjectPanel = React.memo(() => {
  const { project } = useContext(MainContext);

  const { onProjectClick } = useNavigatorPanelHandlers();

  return (
    <>
      <div className="gap-s align-center" onClick={onProjectClick}>
        <SVGIconI {...{ class: "icon-xs" }}>folder</SVGIconI>

        <span className="text-s">{project.name}</span>
      </div>
      <span className="text-s opacity-m">/</span>
    </>
  );
});
