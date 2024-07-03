import { useCallback, useEffect } from "react";

import { CustomDirectoryPickerOptions } from "file-system-access/lib/showDirectoryPicker";
import { del } from "idb-keyval";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { LogAllow } from "@src/indexConstants";
import { DefaultProjectPath } from "@src/indexConstants";
import {
  confirmFileChanges,
  downloadIDBProject,
  initIDBProject,
} from "@_node/index";
import { setTheme } from "@_redux/global";
import { setCmdkPages, setCurrentCommand } from "@_redux/main/cmdk";
import { setDoingFileAction, TProjectContext } from "@_redux/main/fileTree";

import {
  setActivePanel,
  setAutoSave,
  setShowActionsPanel,
  setShowCodeView,
  setWordWrap,
} from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { getCommandKey } from "@_services/global";
import { TCmdkKeyMap, TCmdkReferenceData } from "@_types/main";

import { setSystemTheme } from "../helper";
import useRnbw from "@_services/useRnbw";

interface IUseCmdk {
  cmdkReferenceData: TCmdkReferenceData;
  importProject: (
    fsType: TProjectContext,
    projectHandle?: FileSystemDirectoryHandle | null | undefined,
  ) => Promise<void>;
}
export const useCmdk = ({ cmdkReferenceData, importProject }: IUseCmdk) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    osType,
    theme,
    project,
    fileTree,
    doingFileAction,
    iframeLoading,
    activePanel,
    showActionsPanel,
    showCodeView,
    autoSave,
    wordWrap,
    cmdkOpen,
    cmdkPages,
    currentCommand,
    runningAction,
    showFilePanel,
  } = useAppState();

  const rnbw = useRnbw();
  // handlers
  const onClear = useCallback(async () => {
    window.localStorage.clear();
    await del("recent-project");
  }, []);
  const onJumpstart = useCallback(() => {
    if (cmdkOpen) return;
    dispatch(setCmdkPages(["Jumpstart"]));
  }, [cmdkOpen]);
  const onNew = useCallback(async () => {
    if (!confirmFileChanges(fileTree)) return;

    dispatch(setDoingFileAction(true));
    try {
      await initIDBProject(DefaultProjectPath);
      await importProject("idb");
    } catch (err) {
      LogAllow && console.log("failed to init/load idb project");
    }
    dispatch(setDoingFileAction(false));
  }, [fileTree, importProject]);
  const onOpen = useCallback(async () => {
    if (!confirmFileChanges(fileTree)) return;

    dispatch(setDoingFileAction(true));
    navigate("/");
    try {
      const projectHandle = await showDirectoryPicker({
        _preferPolyfill: false,
        mode: "readwrite",
      } as CustomDirectoryPickerOptions);
      await importProject("local", projectHandle);
    } catch (err) {
      LogAllow && console.log("failed to open local project");
    }
    dispatch(setDoingFileAction(false));
  }, [importProject, fileTree, navigate]);
  const onActions = useCallback(() => {
    if (cmdkOpen) return;
    dispatch(setCmdkPages(["Actions"]));
  }, [cmdkOpen]);
  const onAdd = useCallback(() => {
    dispatch(setCmdkPages([...cmdkPages, "Add"]));
  }, [cmdkPages]);
  const onTurnInto = useCallback(() => {
    dispatch(setCmdkPages([...cmdkPages, "Turn into"]));
  }, [cmdkPages]);
  const onDownload = useCallback(async () => {
    if (project.context !== "idb") return;
    try {
      await downloadIDBProject(DefaultProjectPath);
    } catch (err) {
      LogAllow && console.log("failed to download project");
    }
  }, [project]);
  const onUndo = () => {
    if (!!runningAction || doingFileAction || iframeLoading) return;
    if (activePanel === "file" && showActionsPanel && showFilePanel) {
      rnbw.files.undo();
    } else {
      rnbw.elements.undo();
    }
  };
  const onRedo = () => {
    if (!!runningAction || doingFileAction || iframeLoading) return;

    if (activePanel === "file" && showActionsPanel && showFilePanel) {
      rnbw.files.redo();
    } else {
      rnbw.elements.redo();
    }
  };
  const onToggleCodeView = useCallback(() => {
    dispatch(setShowCodeView(!showCodeView));
  }, [showCodeView]);
  const onToggleActionsPanel = useCallback(() => {
    dispatch(setShowActionsPanel(!showActionsPanel));
  }, [showActionsPanel]);
  const onOpenGuidePage = useCallback(() => {
    window.open("https://guide.rnbw.dev", "_blank", "noreferrer");
  }, []);
  const onOpenSupportPage = useCallback(() => {
    window.open(
      "https://github.com/orgs/rnbwdev/discussions",
      "_blank",
      "noreferrer",
    );
  }, []);
  const onOpenCommunityPage = useCallback(() => {
    window.open("https://discord.gg/HycXz8TJkd", "_blank", "noreferrer");
  }, []);
  const onToggleTheme = useCallback(() => {
    switch (theme) {
      case "System":
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
        dispatch(setTheme("Light"));
        break;
      case "Light":
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        dispatch(setTheme("Dark"));
        break;
      case "Dark":
        localStorage.removeItem("theme");
        dispatch(setTheme("System"));
        setSystemTheme();
        break;
      default:
        break;
    }
  }, [theme]);

  const onToggleAutoSave = useCallback(() => {
    dispatch(setAutoSave(!autoSave));
  }, [autoSave]);

  const onToggleWordWrap = useCallback(() => {
    dispatch(setWordWrap(!wordWrap));
  }, [wordWrap]);

  const closeAllPanel = useCallback(() => {
    dispatch(setShowActionsPanel(false));
    dispatch(setShowCodeView(false));
    //focus on stage
    dispatch(setActivePanel("stage"));
    const iframe: HTMLIFrameElement | null = document.getElementById(
      "iframeId",
    ) as HTMLIFrameElement;
    if (iframe) {
      const contentWindow = iframe.contentWindow;
      if (contentWindow) {
        contentWindow.focus();
      }
    }
  }, []);

  const openAllPanel = useCallback(() => {
    dispatch(setShowActionsPanel(true));
    dispatch(setShowCodeView(true));
  }, []);
  const onSearch = useCallback(() => {
    if (cmdkOpen) return;
    dispatch(setCmdkPages(["Search"]));
  }, [cmdkOpen]);

  const KeyDownEventListener = useCallback(
    (e: KeyboardEvent) => {
      // cmdk obj for the current command
      const cmdk: TCmdkKeyMap = {
        cmd: getCommandKey(e, osType),
        shift: e.shiftKey,
        alt: e.altKey,
        key: e.code,
        click: false,
      };
      // extra cmdk
      if (cmdk.cmd && cmdk.shift && cmdk.key === "KeyR") {
        onClear();
        return;
      }
      if (e.key === "Escape") {
        if (activePanel === "file") {
          if (
            e.target instanceof HTMLElement &&
            e.target.id === "FileTreeView-RenameInput"
          )
            return;
        }
        !cmdkOpen && (showActionsPanel || showCodeView) && closeAllPanel();
        !cmdkOpen && !showActionsPanel && !showCodeView && openAllPanel();
        return;
      }
      // skip inline rename input in file-tree-view
      const targetId = e.target && (e.target as HTMLElement).id;
      if (targetId === "FileTreeView-RenameInput") {
        return;
      }
      // skip monaco-editor shortkeys and general coding
      if (activePanel === "code" || activePanel === "settings") {
        if (!(cmdk.cmd && !cmdk.shift && !cmdk.alt && cmdk.key === "KeyS")) {
          return;
        }
      }
      // detect action
      let action: string | null = null;
      for (const actionName in cmdkReferenceData) {
        const _cmdkArray = cmdkReferenceData[actionName][
          "Keyboard Shortcut"
        ] as TCmdkKeyMap[];

        let matched = false;

        for (const keyObj of _cmdkArray) {
          const key =
            keyObj.key.length === 0
              ? ""
              : keyObj.key === "\\"
                ? "Backslash"
                : (keyObj.key.length === 1 ? "Key" : "") +
                  keyObj.key[0].toUpperCase() +
                  keyObj.key.slice(1);

          if (
            cmdk.cmd === keyObj.cmd &&
            cmdk.shift === keyObj.shift &&
            cmdk.alt === keyObj.alt &&
            cmdk.key === key
          ) {
            action = actionName;
            matched = true;
            break; // Match found, exit the inner loop
          }
        }

        if (matched) {
          break; // Match found, exit the outer loop
        }
      }
      if (action) {
        if (!cmdkOpen) {
          LogAllow && console.log("action to be run by cmdk: ", action);
          dispatch(setCurrentCommand({ action }));
        }
      }

      action && e.preventDefault();
    },
    [osType, cmdkOpen, activePanel, cmdkReferenceData],
  );
  useEffect(() => {
    document.addEventListener("keydown", KeyDownEventListener);
    return () => document.removeEventListener("keydown", KeyDownEventListener);
  }, [KeyDownEventListener]);
  useEffect(() => {
    if (!currentCommand) return;
    switch (currentCommand.action) {
      case "Jumpstart":
        onJumpstart();
        break;
      case "Search":
        onSearch();
        break;
      case "New":
        onNew();
        dispatch(setShowActionsPanel(true));
        dispatch(setShowCodeView(true));
        break;
      case "Open":
        onOpen();
        break;
      case "Theme":
        onToggleTheme();
        break;
      case "Clear":
        onClear();
        break;
      case "Undo":
        onUndo();
        break;
      case "Redo":
        onRedo();
        break;
      case "Actions":
        onActions();
        break;
      case "Add":
        onAdd();
        break;
      case "Code":
        onToggleCodeView();
        break;
      case "Design":
        onToggleActionsPanel();
        break;
      case "Guide":
        onOpenGuidePage();
        break;
      case "Support":
        onOpenSupportPage();
        break;
      case "Community":
        onOpenCommunityPage();
        break;
      case "Download":
        onDownload();
        break;
      case "Turn into":
        (activePanel === "stage" || activePanel === "node") && onTurnInto();
        break;
      case "Autosave":
        onToggleAutoSave();
        break;
      case "Code Wrap":
        onToggleWordWrap();
        break;
      default:
        return;
    }
  }, [currentCommand]);

  return { onJumpstart, onNew, onClear, onUndo, onRedo };
};
