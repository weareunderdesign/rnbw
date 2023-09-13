import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { TFileNodeData } from "@_node/file";
import { MainContext, navigatorSelector } from "@_redux/main";

import { NavigatorPanelProps } from "./types";
import { useNavigationPanelHandlers, useFavicon } from "./hooks";

import {
  unsavedLightProjectImg,
  unsavedDarkProjectImg,
  projectLightImg,
  projectDarkImg,
} from "./constants";

import {
  AdditionalPanel,
  DefaultPanel,
  ProjectPanel,
  WorkspacePanel,
} from "./components";

export default function NavigatorPanel(props: NavigatorPanelProps) {
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { file } = useSelector(navigatorSelector);
  const {
    // navigator
    workspace,
    project,
    navigatorDropDownType,
    // file tree view
    ffTree,
    // references
    filesReferenceData,
    // other
    theme,
    // open project
    loadProject,
    setParseFile,
    favicon,
  } = useContext(MainContext);

  // -------------------------------------------------------------- favicon --------------------------------------------------------------
  const [faviconFallback, setFaviconFallback] = useState<boolean>(false);

  useFavicon(setFaviconFallback);

  // -------------------------------------------------------------- sync --------------------------------------------------------------
  const [unsavedProject, setUnsavedProject] = useState(false);

  useMemo(() => {
    setUnsavedProject(false);
    for (let x in ffTree) {
      if (!ffTree[x].data) continue;
      const nodeData = ffTree[x].data as unknown as TFileNodeData;
      if (nodeData.changed) {
        setUnsavedProject(true);
      }
    }
  }, [ffTree]);

  // set app's favicon
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = unsavedProject
        ? theme === "Light"
          ? unsavedLightProjectImg
          : unsavedDarkProjectImg
        : theme === "Light"
        ? projectLightImg
        : projectDarkImg;
    }
  }, [unsavedProject, theme]);

  // -------------------------------------------------------------- dropdown --------------------------------------------------------------
  const navigatorPanelRef = useRef<HTMLDivElement | null>(null);

  const {
    onProjectClick,
    onFileClick,
    onCloseDropDown,
    onWorkspaceClick,
    onOpenProject,
    onPanelClick,
  } = useNavigationPanelHandlers();

  return useMemo(() => {
    return file.uid !== "" ? (
      <>
        <div
          id="NavigatorPanel"
          className="padding-m border-bottom gap-s"
          onClick={onPanelClick}
          ref={navigatorPanelRef}
        >
          {!navigatorDropDownType ? (
            <DefaultPanel />
          ) : navigatorDropDownType === "workspace" ? (
            <WorkspacePanel />
          ) : navigatorDropDownType === "project" ? (
            <ProjectPanel />
          ) : (
            <></>
          )}
        </div>

        {navigatorDropDownType && (
          <AdditionalPanel navigatorPanel={navigatorPanelRef.current} />
        )}
      </>
    ) : (
      <></>
    );
  }, [
    onPanelClick,
    workspace,
    project,
    file,
    filesReferenceData,
    ffTree,
    onWorkspaceClick,
    onProjectClick,
    onFileClick,
    navigatorDropDownType,
    onCloseDropDown,
    onOpenProject,
    loadProject,
    favicon,
    unsavedProject,
    setParseFile,
    theme,
    faviconFallback,
  ]);
}
