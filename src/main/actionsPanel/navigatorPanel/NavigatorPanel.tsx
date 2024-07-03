import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
import { PanelHeader } from "@src/common/panelHeader";

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

  const updateFavicon = useCallback(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    const lightThemeIcon = unsavedProject
      ? unsavedProjectLightImg
      : projectLightImg;
    const darkThemeIcon = unsavedProject
      ? unsavedProjectDarkImg
      : projectDarkImg;

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "Dark"
      : "Light";

    if (link) {
      if (systemTheme === "Dark") {
        link.href = darkThemeIcon;
      } else {
        link.href = lightThemeIcon;
      }
    }
  }, [unsavedProject, theme]);

  useEffect(() => {
    updateFavicon();
  }, [updateFavicon]);

  useEffect(() => {
    const lightTheme = window.matchMedia("(prefers-color-scheme: light)");
    const darkTheme = window.matchMedia("(prefers-color-scheme: dark)");

    lightTheme.addEventListener("change", updateFavicon);
    darkTheme.addEventListener("change", updateFavicon);

    return () => {
      lightTheme.removeEventListener("change", updateFavicon);
      darkTheme.removeEventListener("change", updateFavicon);
    };
  }, [updateFavicon]);

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
              <DefaultPanel />
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
