import React, { FC, useCallback, useContext, useRef } from "react";
import cx from "classnames";

import { TProject } from "@_types/main";
import { MainContext } from "@_redux/main";
import { SVGIcon } from "@_components/common";

import { useNavigatorPanelHandlers } from "../hooks";

interface AdditionalPanelProps {
  navigatorPanel: HTMLDivElement | null;
}

export const AdditionalPanel: FC<AdditionalPanelProps> = React.memo(
  ({ navigatorPanel }) => {
    const { workspace, project, navigatorDropDownType } =
      useContext(MainContext);

    const navigatorDropDownRef = useRef<HTMLDivElement | null>(null);

    const { onCloseDropDown, onOpenProject } = useNavigatorPanelHandlers();

    const onClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>, project: TProject) => {
        e.stopPropagation();
        onOpenProject(project);
      },
      [],
    );

    return (
      <div
        style={{
          inset: 0,
          zIndex: 1,
        }}
        ref={navigatorDropDownRef}
        onClick={onCloseDropDown}
      >
        <div className="view" style={{ minHeight: "0px" }} />

        {navigatorDropDownType === "workspace" ? (
          <div
            className="border-left border-right border-bottom radius-s background-primary shadow"
            style={{
              // left: Number(navigatorPanel?.getBoundingClientRect().left),
              // top: Number(navigatorPanel?.getBoundingClientRect().top) + 41,

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
                    _project.context === project.context &&
                      _project.name === project.name &&
                      _project.handler === project.handler
                      ? "selected"
                      : "",
                  )}
                  onClick={(
                    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
                  ) => {
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
  },
);
