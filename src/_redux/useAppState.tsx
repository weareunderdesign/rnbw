import { useSelector } from "react-redux";

import { AppState } from "./_root";

export const useAppState = () => {
  const {
    global: { osType, theme },
    main: {
      fileTree: {
        workspace,
        project,
        initialFileUidToOpen,
        currentFileUid,
        prevFileUid,
        prevRenderableFileUid,
        fileTree,
        fileTreeViewState: {
          focusedItem: fFocusedItem,
          expandedItems: fExpandedItems,
          expandedItemsObj: fExpandedItemsObj,
          selectedItems: fSelectedItems,
          selectedItemsObj: fSelectedItemsObj,
        },
        hoveredFileUid,
        doingFileAction,
        lastFileAction,
      },
      fileEvent: {
        past: fileEventPast,
        present: { fileAction },
        future: fileEventFuture,
      },
      nodeTree: {
        nodeTree,
        validNodeTree,
        needToSelectNodePaths,
        needToSelectCode,
        nodeTreeViewState: {
          focusedItem: nFocusedItem,
          expandedItems: nExpandedItems,
          expandedItemsObj: nExpandedItemsObj,
          selectedItems: nSelectedItems,
          selectedItemsObj: nSelectedItemsObj,
        },
        hoveredNodeUid,
        copiedNodeDisplayName,
      },
      nodeEvent: {
        past: nodeEventPast,
        present: { currentFileContent, selectedNodeUids },
        future: nodeEventFuture,
      },
      stageView: {
        iframeSrc,
        iframeLoading,
        needToReloadIframe,
        linkToOpen,
        syncConfigs,
        webComponentOpen,
      },
      codeView: { editingNodeUid: editingNodeUidInCodeView, codeViewTabSize },
      processor: {
        doingAction,
        navigatorDropdownType,
        favicon,
        activePanel,
        clipboardData,
        showActionsPanel,
        showCodeView,
        autoSave,
        formatCode,
        didUndo,
        didRedo,
        loading,
      },
      cmdk: {
        cmdkOpen,
        cmdkPages,
        currentCmdkPage,
        cmdkSearchContent,
        currentCommand,
      },
    },
  } = useSelector((state: AppState) => state);

  const fileEventPastLength = fileEventPast.length;
  const fileEventFutureLength = fileEventFuture.length;

  const nodeEventPastLength = nodeEventPast.length;
  const nodeEventFutureLength = nodeEventFuture.length;

  return {
    osType,
    theme,

    workspace,
    project,
    initialFileUidToOpen,
    currentFileUid,
    prevFileUid,
    prevRenderableFileUid,
    fileTree,

    fFocusedItem,
    fExpandedItems,
    fExpandedItemsObj,
    fSelectedItems,
    fSelectedItemsObj,
    hoveredFileUid,

    doingFileAction,
    lastFileAction,

    fileAction,
    fileEventPast,
    fileEventPastLength,
    fileEventFuture,
    fileEventFutureLength,

    nodeTree,
    validNodeTree,

    needToSelectNodePaths,
    needToSelectCode,

    nFocusedItem,
    nExpandedItems,
    nExpandedItemsObj,
    nSelectedItems,
    nSelectedItemsObj,
    hoveredNodeUid,
    copiedNodeDisplayName,

    currentFileContent,
    selectedNodeUids,

    nodeEventPast,
    nodeEventPastLength,
    nodeEventFuture,
    nodeEventFutureLength,

    iframeSrc,
    iframeLoading,
    needToReloadIframe,
    linkToOpen,
    syncConfigs,
    webComponentOpen,

    editingNodeUidInCodeView,
    codeViewTabSize,

    doingAction,

    navigatorDropdownType,
    favicon,

    activePanel,
    clipboardData,

    showActionsPanel,
    showCodeView,

    autoSave,
    formatCode,

    didUndo,
    didRedo,
    loading,

    cmdkOpen,
    cmdkPages,
    currentCmdkPage,

    cmdkSearchContent,
    currentCommand,
  };
};
