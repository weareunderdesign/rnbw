import React, { FC } from "react";

import { SVGIcon } from "@src/components";
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
        <SVGIcon name="folder" className="icon-xs" />
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
