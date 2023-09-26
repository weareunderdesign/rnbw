import React, { useContext, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  ffSelector,
  globalSelector,
  MainContext,
  navigatorSelector,
} from "@_redux/main";

import NavigatorPanel from "./navigatorPanel";
import NodeTreeView from "./nodeTreeView";
import SettingsPanel from "./settingsPanel";
import { ActionsPanelProps } from "./types";
import WorkspaceTreeView from "./workspaceTreeView";

export default function ActionsPanel(props: ActionsPanelProps) {
  const {showCodeView} = props;

  const dispatch = useDispatch();
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { file } = useSelector(navigatorSelector);
  const { fileAction } = useSelector(globalSelector);
  const {
    focusedItem,
    expandedItems,
    expandedItemsObj,
    selectedItems,
    selectedItemsObj,
  } = useSelector(ffSelector);
  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // navigator
    workspace,
    project,
    navigatorDropDownType,
    setNavigatorDropDownType,
    // node actions
    activePanel,
    setActivePanel,
    clipboardData,
    setClipboardData,
    event,
    setEvent,
    // actions panel
    showActionsPanel,
    // file tree view
    initialFileToOpen,
    setInitialFileToOpen,
    fsPending,
    setFSPending,
    ffTree,
    setFFTree,
    setFFNode,
    ffHandlers,
    setFFHandlers,
    ffHoveredItem,
    setFFHoveredItem,
    isHms,
    setIsHms,
    ffAction,
    setFFAction,
    currentFileUid,
    setCurrentFileUid,
    // node tree view
    fnHoveredItem,
    setFNHoveredItem,
    nodeTree,
    setNodeTree,
    validNodeTree,
    setValidNodeTree,
    nodeMaxUid,
    setNodeMaxUid,
    // stage view
    iframeLoading,
    setIFrameLoading,
    iframeSrc,
    setIFrameSrc,
    fileInfo,
    setFileInfo,
    needToReloadIFrame,
    setNeedToReloadIFrame,
    linkToOpen,
    setLinkToOpen,
    // code view
    codeEditing,
    setCodeEditing,
    codeChanges,
    setCodeChanges,
    tabSize,
    setTabSize,
    newFocusedNodeUid,
    setNewFocusedNodeUid,
    // processor
    updateOpt,
    setUpdateOpt,
    // references
    filesReferenceData,
    htmlReferenceData,
    cmdkReferenceData,
    // cmdk
    currentCommand,
    setCurrentCommand,
    cmdkOpen,
    setCmdkOpen,
    cmdkPages,
    setCmdkPages,
    cmdkPage,
    // other
    osType,
    theme,
    // toasts
    addMessage,
    removeMessage,
  } = useContext(MainContext);

  return useMemo(() => {
    return (
      <>
        <div
          id="ActionsPanel"
          className="border radius-s background-primary shadow"
          style={{
            position: "absolute",
            top: props.offsetTop,
            left: props.offsetLeft,
            width: props.width,
            height: props.height,

            overflow: "hidden",

            ...(showActionsPanel
              ? {}
              : { width: "0", overflow: "hidden", border: "none" }),
          }}
        >
          <NavigatorPanel />
          <WorkspaceTreeView />
          <NodeTreeView 
            showCodeView={showCodeView}
          />
          {false && <SettingsPanel />}
        </div>
      </>
    );
  }, [props, showActionsPanel]);
}
