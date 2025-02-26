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
import { PanelHeader } from "@src/sidebarView/panelHeader";
import IconButton from "@src/components/IconButton/IconButton";
import { useDispatch } from "react-redux";
import { setCmdkPages } from "@src/_redux/main/cmdk";
import { setReloadIframe } from "@src/_redux/main/designView";

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
    cmdkPages,
    cmdkOpen,
  } = useAppState();

  const { importProject } = useContext(MainContext);

  const dispatch = useDispatch();

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

  const onJumpstart = useCallback(() => {
    if (cmdkOpen) return;
    dispatch(setCmdkPages(["Jumpstart"]));
  }, [cmdkOpen]);

  const onAdd = useCallback(() => {
    dispatch(setCmdkPages([...cmdkPages, "Add"]));
  }, [cmdkPages]);

  const simulateKeyboardEvent = (key: string) => {
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      code: `Key${key.toUpperCase()}`,
      charCode: key.charCodeAt(0),
    });
    document.dispatchEvent(event);
  };

  const handleReload = () => {
    dispatch(setReloadIframe(true));
  };

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
          className="border-bottom padding-s"
        >
          <div
            className="gap-s justify-start align-center"
            style={{ overflow: "hidden", width: "100%", position: "relative" }}
            onClick={onPanelClick}
            ref={navigatorPanelRef}
          >
            <IconButton iconName="emoji" onClick={onJumpstart} />

            <span className="text-s opacity-m">/</span>
            {showFilePanel ? (
              <ProjectPanel unsavedProject={unsavedProject} />
            ) : (
              <DefaultPanel />
            )}
            <div
              className="align-center background-primary"
              style={{
                position: "absolute",
                right: "0px",
              }}
            >
              <IconButton iconName="plus" onClick={onAdd} />
              <IconButton iconName="sync" onClick={handleReload} />
              <IconButton
                iconName="code-html"
                onClick={() => simulateKeyboardEvent("C")}
              />
            </div>
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
