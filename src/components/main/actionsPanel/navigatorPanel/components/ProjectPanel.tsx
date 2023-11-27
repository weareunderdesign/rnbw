import React from "react";

import { SVGIconI } from "@_components/common";

import { useNavigatorPanelHandlers } from "../hooks";
import { useAppState } from "@_redux/useAppState";

export const ProjectPanel = () => {
  const { project } = useAppState();
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
};
