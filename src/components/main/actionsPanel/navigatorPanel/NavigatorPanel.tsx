import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";

import { AdditionalPanel, DefaultPanel, ProjectPanel } from "./components";
import {
  projectDarkImg,
  projectLightImg,
  unsavedProjectDarkImg,
  unsavedProjectLightImg,
} from "./constants";
import { useFavicon, useNavigatorPanelHandlers } from "./hooks";
import { NavigatorPanelProps } from "./types";
import { PanelButton } from "./components/PanelButton";

export default function NavigatorPanel(props: NavigatorPanelProps) {
  const {
    theme,
    navigatorDropdownType,
    favicon,
    workspace,
    project,
    fileTree,
    currentFileUid,
    filesReferenceData,
  } = useAppState();

  const {
    // open project
    importProject,
  } = useContext(MainContext);

  const [faviconFallback, setFaviconFallback] = useState(false);
  useFavicon(setFaviconFallback);

  const [unsavedProject, setUnsavedProject] = useState(false);
  useMemo(() => {
    for (const uid in fileTree) {
      if (fileTree[uid].data.changed) {
        setUnsavedProject(true);
        return;
      }
    }
    setUnsavedProject(false);
  }, [fileTree]);

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = unsavedProject
        ? theme === "Light"
          ? unsavedProjectLightImg
          : unsavedProjectDarkImg
        : theme === "Light"
          ? projectLightImg
          : projectDarkImg;
    }
  }, [unsavedProject, theme]);

  const navigatorPanelRef = useRef<HTMLDivElement | null>(null);

  const {
    onProjectClick,
    onFileClick,
    onCloseDropDown,
    onWorkspaceClick,
    onOpenProject,
    onPanelClick,
  } = useNavigatorPanelHandlers();

  return useMemo(() => {
    return currentFileUid !== "" ? (
      <>
        <div
          id="NavigatorPanel"
          className="border-bottom padding-m"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="gap-s" onClick={onPanelClick} ref={navigatorPanelRef}>
            {!navigatorDropdownType ? (
              <DefaultPanel />
            ) : navigatorDropdownType === "workspace" ? (
              <></>
            ) : navigatorDropdownType === "project" ? (
              <ProjectPanel unsavedProject={unsavedProject} />
            ) : (
              <></>
            )}
          </div>
          <PanelButton />
        </div>
        {navigatorDropdownType && (
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
    fileTree,
    currentFileUid,
    filesReferenceData,
    onWorkspaceClick,
    onProjectClick,
    onFileClick,
    navigatorDropdownType,
    onCloseDropDown,
    onOpenProject,
    importProject,
    favicon,
    unsavedProject,
    theme,
    faviconFallback,
  ]);
}
