import React, { FC, useContext, useRef } from "react";

import cx from "classnames";

import { SVGIcon } from "@_components/common";
import { TProject } from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";

import { isSelected } from "../helpers";
import { useNavigatorPanelHandlers } from "../hooks";
import { MainContext } from "@_redux/main";

interface AdditionalPanelProps {
  navigatorPanel: HTMLDivElement | null;
}

export const AdditionalPanel: FC<AdditionalPanelProps> = ({
  navigatorPanel,
}) => {
  const { workspace, project, navigatorDropdownType } = useAppState();
  const { projectHandlers } = useContext(MainContext);

  const navigatorDropDownRef = useRef<HTMLDivElement | null>(null);

  const { onCloseDropDown, onOpenProject } = useNavigatorPanelHandlers();

  const onClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    project: Omit<TProject, "handler">,
  ) => {
    e.stopPropagation();
    onOpenProject({
      ...project,
      handler: projectHandlers[project.name] as FileSystemDirectoryHandle,
    });
  };

  return (
    <div
      style={{ inset: 0, zIndex: 1 }}
      ref={navigatorDropDownRef}
      onClick={onCloseDropDown}
    >
      <div className="view" style={{ minHeight: "0px" }} />

      {navigatorDropdownType === "workspace" ? (
        <div
          className="border-left border-right border-bottom radius-s background-primary shadow"
          style={{
            width: Number(navigatorPanel?.clientWidth),
            maxHeight: "300px",

            borderTopLeftRadius: "0px",
            borderTopRightRadius: "0px",

            zIndex: 2,
          }}
        >
          {workspace.projects.map((_project, index) => {
            return _project.context == "idb" ? (
              <></>
            ) : (
              <div
                key={index}
                className={cx(
                  "navigator-project-item",
                  "justify-stretch padding-s",
                  isSelected(_project, project),
                )}
                onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                  onClick(e, _project);
                }}
              >
                <div className="gap-s align-center">
                  <div className="navigator-project-item-icon">
                    {_project.favicon ? (
                      <img
                        className="icon-s"
                        style={{ borderRadius: "50%" }}
                        src={_project.favicon}
                      />
                    ) : (
                      <SVGIcon {...{ class: "icon-xs" }}>folder</SVGIcon>
                    )}
                  </div>
                  <span className="navigator-project-item-name text-s">
                    {_project.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
