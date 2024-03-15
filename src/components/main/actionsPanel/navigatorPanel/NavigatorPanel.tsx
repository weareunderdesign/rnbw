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
import { PanelButton } from "./components/PanelButton";
import { PanelHeader } from "@_components/common/panelHeader";

export default function NavigatorPanel() {
  const {
    theme,
    navigatorDropdownType,
    favicon,
    workspace,
    project,
    fileTree,
    currentFileUid,
    filesReferenceData,
    showFilePanel,
  } = useAppState();

  const { importProject } = useContext(MainContext);

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
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
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
        <PanelHeader
          id="NavigatorPanel"
          className="border-bottom padding-m"
          height="12px"
        >
          <div
            className="gap-s"
            style={{ overflow: "hidden", width: "100%" }}
            onClick={onPanelClick}
            ref={navigatorPanelRef}
          >
            {showFilePanel ? (
              <ProjectPanel unsavedProject={unsavedProject} />
            ) : (
              !navigatorDropdownType && <DefaultPanel />
            )}
          </div>
          <PanelButton />
        </PanelHeader>

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
    showFilePanel,
  ]);
}
