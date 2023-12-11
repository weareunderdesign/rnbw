import React, { FC } from "react";

import { SVGIconI } from "@_components/common";
import { useAppState } from "@_redux/useAppState";

import { useNavigatorPanelHandlers } from "../hooks";

export const ProjectPanel: FC<{ unsavedProject: boolean }> = ({
  unsavedProject,
}) => {
  const { project } = useAppState();
  const { onProjectClick } = useNavigatorPanelHandlers();

  return (
    <>
      <div className="gap-s align-center" onClick={onProjectClick}>
        <SVGIconI {...{ class: "icon-xs" }}>folder</SVGIconI>
        <span className="text-s">{project.name}</span>
        {unsavedProject && (
          <div
            className="radius-s foreground-primary"
            title="unsaved file"
            style={{ width: "6px", height: "6px" }}
          />
        )}
      </div>
      <span className="text-s opacity-m">/</span>
    </>
  );
};
