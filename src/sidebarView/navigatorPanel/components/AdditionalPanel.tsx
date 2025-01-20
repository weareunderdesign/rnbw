import React, { FC, useRef, useState } from "react";

import { SVGIcon } from "@src/components";
import { TProject } from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";

import { isSelected } from "../helpers";
import { useNavigatorPanelHandlers } from "../hooks";

interface AdditionalPanelProps {
  navigatorPanel: HTMLDivElement | null;
}

export const AdditionalPanel: FC<AdditionalPanelProps> = ({
  navigatorPanel,
}) => {
  const { workspace, project, navigatorDropdownType, projectHandlers } =
    useAppState();

  const navigatorDropDownRef = useRef<HTMLDivElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
            const isHovered = index === hoveredIndex;
            const isProjectSelected = isSelected(_project, project);
            const iconBackgroundColor =
              isHovered || isProjectSelected
                ? "var(--color-primary-background)"
                : "var(--color-secondary-background)";
            const iconColor =
              isHovered || isProjectSelected
                ? "var(--color-primary-foreground)"
                : "var(--color-secondary-foreground)";
            const textOpacity = isHovered || isProjectSelected ? 1 : 0.5;

            return _project.context == "idb" ? (
              <></>
            ) : (
              <div
                key={index}
                className={`justify-stretch padding-s ${isProjectSelected ? "selected" : ""}`}
                onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                  onClick(e, _project);
                }}
                style={{
                  cursor: "pointer",
                  backgroundColor: isProjectSelected
                    ? "var(--color-secondary-background)"
                    : "transparent",
                  color: isProjectSelected
                    ? "var(--color-secondary-foreground)"
                    : "inherit",
                }}
                onMouseOver={() => setHoveredIndex(index)}
                onMouseOut={() => setHoveredIndex(null)}
              >
                <div className="gap-s align-center">
                  <div
                    style={{
                      backgroundColor: iconBackgroundColor,
                      color: iconColor,
                    }}
                  >
                    {_project.favicon ? (
                      <img
                        className="icon-s"
                        style={{ borderRadius: "50%" }}
                        src={_project.favicon}
                      />
                    ) : (
                      <SVGIcon name="folder" className="icon-xs" />
                    )}
                  </div>
                  <span
                    style={{
                      opacity: textOpacity,
                    }}
                  >
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
