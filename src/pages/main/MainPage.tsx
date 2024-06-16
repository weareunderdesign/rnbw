import React, { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Loader, Notification } from "@_components/common";
import { ActionsPanel, CodeView, StageView } from "@_components/main";
import { CodeViewSyncDelay } from "@_constants/main";
import { isUnsavedProject } from "@_node/file";
import { MainContext } from "@_redux/main";
import { setCurrentCommand } from "@_redux/main/cmdk";
import { useAppState } from "@_redux/useAppState";

import { useCmdk, useHandlers, useInit, useReferneces } from "./hooks";
import Processor from "./processor";
import ResizablePanels from "./ResizablePanels";
import { debounce } from "./helper";
import { CommandDialog } from "./cmdkPage/CommandDialog";
import { TNodeUid, TValidNodeUid } from "@_node/index";

export default function MainPage() {
  // redux
  const dispatch = useDispatch();
  const { currentFileUid, fileTree, autoSave, cmdkReferenceData } =
    useAppState();

  const { monacoEditorRef, setMonacoEditorRef, iframeRefRef, setIframeRefRef } =
    useReferneces();

  // hooks
  const { importProject, closeNavigator, reloadCurrentProject } = useHandlers();
  const { onNew, onUndo, onRedo, onClear, onJumpstart } = useCmdk({
    cmdkReferenceData,
    importProject,
  });
  useInit({ importProject, onNew });

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const prevFocusedElement = React.useRef<HTMLElement | null>(
    window.document.activeElement as HTMLElement | null,
  );
  const maxNodeUidRef = React.useRef<TValidNodeUid>(0);
  const setMaxNodeUidRef = (maxNodeUid: TValidNodeUid) => {
    maxNodeUidRef.current = maxNodeUid;
  };

  const contentEditableUidRef = React.useRef<TNodeUid>("");
  const setContentEditableUidRef = (uid: TNodeUid) => {
    contentEditableUidRef.current = uid;
  };

  const INTERVAL_TIMER = 2000;
  // web-tab close event handler
  useEffect(() => {
    window.onbeforeunload = isUnsavedProject(fileTree) ? () => "changed" : null;
    return () => {
      window.onbeforeunload = null;
    };
  }, [fileTree]);

  // reload project after local file changes
  const debouncedCurrentProjectReload = useCallback(() => {
    debounce(reloadCurrentProject, CodeViewSyncDelay)();
  }, [fileTree, currentFileUid, autoSave]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      fileTree[currentFileUid]?.data?.changed
        ? autoSave && dispatch(setCurrentCommand({ action: "Save" }))
        : debouncedCurrentProjectReload();
    }
  }, [fileTree, currentFileUid, debouncedCurrentProjectReload, autoSave]);

  const handleBlurChange = useCallback(() => {
    if (
      !window.document.activeElement?.isEqualNode(prevFocusedElement.current)
    ) {
      return;
    }
    intervalRef.current = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !fileTree[currentFileUid]?.data?.changed
      ) {
        debouncedCurrentProjectReload();
      }
    }, INTERVAL_TIMER);
  }, [fileTree, currentFileUid, debouncedCurrentProjectReload]);

  const handleFocusChange = useCallback(() => {
    if (intervalRef.current) {
      prevFocusedElement.current = window.document.activeElement as HTMLElement;
      clearInterval(intervalRef.current);
    }
  }, []);
  const handleOnWheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const addEventListeners = useCallback(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("wheel", handleOnWheel, { passive: false });
    window.addEventListener("blur", handleBlurChange);
    window.addEventListener("focus", handleFocusChange);
    const contentWindow = iframeRefRef.current?.contentWindow;
    if (contentWindow) {
      contentWindow.addEventListener("focus", handleFocusChange);
      contentWindow.addEventListener("blur", handleBlurChange);
    }
  }, [
    handleVisibilityChange,
    handleFocusChange,
    handleBlurChange,
    iframeRefRef,
  ]);

  const removeEventListeners = useCallback(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    document.removeEventListener("wheel", handleOnWheel);
    window.removeEventListener("blur", handleBlurChange);
    window.removeEventListener("focus", handleFocusChange);
    const contentWindow = iframeRefRef.current?.contentWindow;
    if (contentWindow) {
      contentWindow.removeEventListener("focus", handleFocusChange);
      contentWindow.removeEventListener("blur", handleBlurChange);
    }
  }, [
    handleVisibilityChange,
    handleFocusChange,
    handleBlurChange,
    iframeRefRef,
  ]);

  useEffect(() => {
    addEventListeners();
    return () => {
      removeEventListeners();
    };
  }, [addEventListeners, removeEventListeners]);

  return (
    <>
      <MainContext.Provider
        value={{
          maxNodeUidRef,
          setMaxNodeUidRef,

          monacoEditorRef,
          setMonacoEditorRef,

          contentEditableUidRef,
          setContentEditableUidRef,

          iframeRefRef,
          setIframeRefRef,

          importProject,
          reloadCurrentProject,

          onUndo,
          onRedo,
        }}
      >
        <Processor></Processor>
        <div
          id="MainPage"
          className={"view background-primary"}
          style={{ display: "relative" }}
          onClick={closeNavigator}
        >
          <Loader />
          <ResizablePanels
            actionPanel={<ActionsPanel />}
            codeView={<CodeView />}
            stageView={<StageView />}
          />
          <Notification />
        </div>

        <CommandDialog onClear={onClear} onJumpstart={onJumpstart} />
      </MainContext.Provider>
    </>
  );
}
