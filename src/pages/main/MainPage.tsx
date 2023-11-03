import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import cx from "classnames";
import { Command } from "cmdk";
import { CustomDirectoryPickerOptions } from "file-system-access/lib/showDirectoryPicker";
import { delMany, getMany, setMany } from "idb-keyval";
import { editor } from "monaco-editor";
import { useDispatch } from "react-redux";

import { SVGIcon } from "@_components/common";
import { ActionsPanel, CodeView, StageView } from "@_components/main";
import Processor from "@_components/main/processor";
import { LogAllow } from "@_constants/global";
import {
  AddActionPrefix,
  DefaultProjectPath,
  ParsableFileTypes,
  RecentProjectCount,
  RootNodeUid,
} from "@_constants/main";
import {
  downloadProject,
  initIDBProject,
  loadIDBProject,
  loadLocalProject,
  TFileHandlerCollection,
  TFileNodeData,
  TFilesReference,
  TFilesReferenceData,
} from "@_node/file";
import {
  THtmlElementsReference,
  THtmlElementsReferenceData,
  THtmlReferenceData,
} from "@_node/html";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { setOsType, setTheme } from "@_redux/global";
import { MainContext } from "@_redux/main";
import {
  setCmdkOpen,
  setCmdkPages,
  setCmdkSearchContent,
  setCurrentCmdkPage,
  setCurrentCommand,
} from "@_redux/main/cmdk";
import {
  setCurrentFileUid,
  setDoingFileAction,
  setFileTree,
  setInitialFileUidToOpen,
  setProject,
  setWorkspace,
  TProject,
  TProjectContext,
} from "@_redux/main/fileTree";
import {
  FileTree_Event_ClearActionType,
  setFileAction,
} from "@_redux/main/fileTree/event";
import { setNodeTree, setValidNodeTree } from "@_redux/main/nodeTree";
import { NodeTree_Event_ClearActionType } from "@_redux/main/nodeTree/event";
import {
  setDidUndo,
  setFavicon,
  setNavigatorDropdownType,
  setShowActionsPanel,
  setShowCodeView,
  setUpdateOptions,
} from "@_redux/main/processor";
import { setIframeSrc } from "@_redux/main/stageView";
import { useAppState } from "@_redux/useAppState";
// @ts-ignore
import cmdkRefActions from "@_ref/cmdk.ref/Actions.csv";
// @ts-ignore
import cmdkRefJumpstart from "@_ref/cmdk.ref/Jumpstart.csv";
// @ts-ignore
import filesRef from "@_ref/rfrncs/Files.csv";
// @ts-ignore
import htmlRefElements from "@_ref/rfrncs/HTML Elements.csv";
import {
  TCmdkContext,
  TCmdkContextScope,
  TCmdkGroupData,
  TCmdkKeyMap,
  TCmdkReference,
  TCmdkReferenceData,
  TCodeChange,
  TSession,
} from "@_types/main";

import { getCommandKey, isChromeOrEdge } from "../../services/global";
import { addDefaultCmdkActions } from "./helper";

export default function MainPage() {
  // ***************************************** Reducer Begin *****************************************
  const dispatch = useDispatch();
  const {
    osType,
    theme,

    workspace,
    project,
    initialFileUidToOpen,
    currentFileUid,
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

    nFocusedItem,
    nExpandedItems,
    nExpandedItemsObj,
    nSelectedItems,
    nSelectedItemsObj,
    hoveredNodeUid,

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

    codeViewTabSize,
    codeEditing,

    navigatorDropdownType,
    favicon,

    activePanel,
    clipboardData,

    showActionsPanel,
    showCodeView,

    didUndo,
    didRedo,

    updateOptions,

    cmdkOpen,
    cmdkPages,
    currentCmdkPage,

    cmdkSearchContent,
    currentCommand,
  } = useAppState();
  // ***************************************** Reducer End *****************************************

  // ***************************************** Context Begin *****************************************
  const [doingAction, setDoingAction] = useState(false);
  const runningActions = useRef<{ [actionName: string]: true }>({});
  const hasRunningAction = useCallback(
    () => (Object.keys(runningActions.current).length === 0 ? false : true),
    [],
  );
  const addRunningActions = useCallback((actionNames: string[]) => {
    let found = false;
    for (const actionName of actionNames) {
      if (!runningActions.current[actionName]) {
        runningActions.current[actionName] = true;
        found = true;
      }
    }
    if (!found) return;

    setDoingAction(true);
  }, []);
  const removeRunningActions = useCallback(
    (actionNames: string[]) => {
      let found = false;
      for (const actionName of actionNames) {
        if (runningActions.current[actionName]) {
          delete runningActions.current[actionName];
          found = true;
        }
      }
      if (!found) return;

      !hasRunningAction() && setDoingAction(false);
    },
    [hasRunningAction],
  );

  const [currentProjectFileHandler, setCurrentProjectFileHandler] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [fileHandlers, setFileHandlers] = useState<TFileHandlerCollection>({});

  const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const setMonacoEditorRef = (
    editorInstance: editor.IStandaloneCodeEditor | null,
  ) => {
    monacoEditorRef.current = editorInstance;
  };

  // code view
  const isContentProgrammaticallyChanged = useRef<boolean>(false);
  function setIsContentProgrammaticallyChanged(value: boolean) {
    isContentProgrammaticallyChanged.current = value;
  }
  const [codeChanges, setCodeChanges] = useState<TCodeChange[]>([]);
  const [newFocusedNodeUid, setNewFocusedNodeUid] = useState<TNodeUid>("");

  // references
  const [filesReferenceData, setFilesReferenceData] =
    useState<TFilesReferenceData>({});
  const [htmlReferenceData, setHtmlReferenceData] =
    useState<THtmlReferenceData>({
      elements: {},
    });
  const [cmdkReferenceData, setCmdkReferenceData] =
    useState<TCmdkReferenceData>({});
  const [cmdkReferenceJumpstart, setCmdkReferenceJumpstart] =
    useState<TCmdkGroupData>({});
  const [cmdkReferenceActions, setCmdkReferenceActions] =
    useState<TCmdkGroupData>({});

  // non-parse file editable
  const [parseFileFlag, setParseFile] = useState<boolean>(true);
  const [prevFileUid, setPrevFileUid] = useState<string>("");

  // guide ref
  const guideRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    dispatch(
      setCurrentCmdkPage(
        cmdkPages.length === 0 ? "" : cmdkPages[cmdkPages.length - 1],
      ),
    );
  }, [cmdkPages]);
  const cmdkReferenceAdd = useMemo<TCmdkGroupData>(() => {
    const data: TCmdkGroupData = {
      Files: [],
      Elements: [],
      Recent: [],
    };

    // Files
    const fileNode = fileTree[fFocusedItem];
    if (fileNode) {
      filesRef.map((fileRef: TFilesReference) => {
        fileRef.Name &&
          data["Files"].push({
            Featured: fileRef.Featured === "Yes",
            Name: fileRef.Name,
            Icon: fileRef.Icon,
            Description: fileRef.Description,
            "Keyboard Shortcut": {
              cmd: false,
              shift: false,
              alt: false,
              key: "",
              click: false,
            },
            Group: "Add",
            Context: `File-${fileRef.Extension}`,
          });
      });
    }
    data["Files"] = data["Files"].filter(
      (element) => element.Featured || !!cmdkSearchContent,
    );
    if (data["Files"].length === 0) {
      delete data["Files"];
    }

    // Elements
    let flag = true;
    for (let x in nodeTree) {
      if (nodeTree[x].displayName === "html") {
        flag = false;
      }
    }

    if (!flag) {
      const htmlNode = nodeTree[nFocusedItem];
      if (
        htmlNode &&
        htmlNode.parentUid &&
        htmlNode.parentUid !== RootNodeUid
      ) {
        const parentNode = nodeTree[htmlNode.parentUid as TNodeUid];
        const refData = htmlReferenceData.elements[parentNode.displayName];
        if (refData) {
          if (refData.Contain === "All") {
            Object.keys(htmlReferenceData.elements).map((tag: string) => {
              const tagRef = htmlReferenceData.elements[tag];
              if (tagRef !== undefined) {
                data["Elements"].push({
                  Featured: tagRef && tagRef.Featured === "Yes" ? true : false,
                  Name: tagRef.Name,
                  Icon: tagRef.Icon,
                  Description: tagRef.Description,
                  "Keyboard Shortcut": {
                    cmd: false,
                    shift: false,
                    alt: false,
                    key: "",
                    click: false,
                  },
                  Group: "Add",
                  Context: `Node-${tagRef.Tag}`,
                });
              }
            });
          } else if (refData.Contain === "None") {
            // do nothing
          } else {
            const tagList = refData.Contain.replace(/ /g, "").split(",");
            tagList.map((tag: string) => {
              const pureTag = tag.slice(1, tag.length - 1);
              const tagRef = htmlReferenceData.elements[pureTag];
              if (tagRef !== undefined) {
                data["Elements"].push({
                  Featured: tagRef && tagRef.Featured === "Yes" ? true : false,
                  Name: tagRef.Name,
                  Icon: tagRef.Icon,
                  Description: tagRef.Description,
                  "Keyboard Shortcut": {
                    cmd: false,
                    shift: false,
                    alt: false,
                    key: "",
                    click: false,
                  },
                  Group: "Add",
                  Context: `Node-${tagRef.Tag}`,
                });
              }
            });
          }
        }
      }
    } else {
      data["Elements"] = [];
      let tagRef = htmlReferenceData.elements["html"];
      tagRef &&
        data["Elements"].push({
          Featured: tagRef && tagRef.Featured === "Yes" ? true : false,
          Name: tagRef.Name.toUpperCase(),
          Icon: tagRef.Icon,
          Description: tagRef.Description,
          "Keyboard Shortcut": {
            cmd: false,
            shift: false,
            alt: false,
            key: "",
            click: false,
          },
          Group: "Add",
          Context: `Node-${tagRef.Tag}`,
        });
    }
    if (
      data["Elements"].length > 0 &&
      data["Elements"].filter(
        (element) => element.Featured || !!cmdkSearchContent,
      ).length > 0
    ) {
      data["Elements"] = data["Elements"].filter(
        (element) => element.Featured || !!cmdkSearchContent,
      );
    }
    if (data["Elements"].length === 0) {
      delete data["Elements"];
    }

    // Recent
    delete data["Recent"];

    return data;
  }, [fileTree, fFocusedItem, nodeTree, nFocusedItem, htmlReferenceData]);
  useEffect(() => {
    // check if current broswer is Chrome or Edge
    if (!isChromeOrEdge()) {
      const message = `Browser is unsupported. rnbw works in the latest versions of Google Chrome and Microsoft Edge.`;
      if (!window.confirm(message)) {
        return;
      }
    }

    dispatch(setWorkspace({ name: "local", projects: [] }));
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    window.document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }, []);
  // -------------------------------------------------------------- recent project --------------------------------------------------------------
  const [recentProjectContexts, setRecentProjectContexts] = useState<
    TProjectContext[]
  >([]);
  const [recentProjectNames, setRecentProjectNames] = useState<string[]>([]);
  const [recentProjectHandlers, setRecentProjectHandlers] = useState<
    (FileSystemDirectoryHandle | null)[]
  >([]);
  const cmdkReferneceRecentProject = useMemo<TCmdkReference[]>(() => {
    const _projects: TProject[] = [];
    const _cmdkReferneceRecentProject: TCmdkReference[] = [];
    recentProjectContexts.map((_v, index) => {
      if (_v != "idb") {
        _projects.push({
          context: recentProjectContexts[index],
          name: recentProjectNames[index],
          handler: recentProjectHandlers[index],
          favicon: null,
        });
        _cmdkReferneceRecentProject.push({
          Name: recentProjectNames[index],
          Icon: "folder",
          Description: "",
          "Keyboard Shortcut": {
            cmd: false,
            shift: false,
            alt: false,
            key: "",
            click: false,
          },
          Group: "Recent",
          Context: index.toString(),
        });
      }
    });
    setWorkspace({ name: workspace.name, projects: _projects });
    return _cmdkReferneceRecentProject;
  }, [recentProjectContexts, recentProjectNames, recentProjectHandlers]);
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  const cb_onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const cmdk: TCmdkKeyMap = {
        cmd: getCommandKey(e, osType),
        shift: e.shiftKey,
        alt: e.altKey,
        key: e.code,
        click: false,
      };

      if (e.key === "Escape") {
        closeAllPanel();
        return;
      }
      if (cmdk.shift && cmdk.cmd && cmdk.key === "KeyR") {
        onClear();
      }
      if (cmdk.cmd && cmdk.key === "KeyG") {
        e.preventDefault();
        e.stopPropagation();
        // return
      }
      if (cmdkOpen) return;

      // skip inline rename input in file-tree-view
      const targetId = e.target && (e.target as HTMLElement).id;
      if (targetId === "FileTreeView-RenameInput") {
        return;
      }

      // skip monaco-editor shortkeys and general coding
      if (activePanel === "code") {
        if (!(cmdk.cmd && !cmdk.shift && !cmdk.alt && cmdk.key === "KeyS")) {
          return;
        }
      }

      // detect action
      let action: string | null = null;
      for (const actionName in cmdkReferenceData) {
        const _cmdk = cmdkReferenceData[actionName][
          "Keyboard Shortcut"
        ] as TCmdkKeyMap;

        const key =
          _cmdk.key.length === 0
            ? ""
            : _cmdk.key === "\\"
            ? "Backslash"
            : (_cmdk.key.length === 1 ? "Key" : "") +
              _cmdk.key[0].toUpperCase() +
              _cmdk.key.slice(1);
        if (
          cmdk.cmd === _cmdk.cmd &&
          cmdk.shift === _cmdk.shift &&
          cmdk.alt === _cmdk.alt &&
          cmdk.key === key
        ) {
          action = actionName;
          break;
        }
      }
      if (action === null) return;

      LogAllow && console.log("action to be run by cmdk: ", action);

      // prevent chrome default short keys
      if (
        action === "Save" ||
        action === "Download" ||
        action === "Duplicate"
      ) {
        e.preventDefault();
      }

      dispatch(setCurrentCommand({ action }));
    },
    [cmdkOpen, cmdkReferenceData, activePanel, osType],
  );
  useEffect(() => {
    document.addEventListener("keydown", cb_onKeyDown);
    return () => document.removeEventListener("keydown", cb_onKeyDown);
  }, [cb_onKeyDown]);
  useEffect(() => {
    if (!currentCommand) return;

    switch (currentCommand.action) {
      case "Jumpstart":
        onJumpstart();
        break;
      case "New":
        onNew();
        toogleCodeView();
        // show actions panel by default
        !showActionsPanel && dispatch(setShowActionsPanel(true));
        break;
      case "Open":
        onOpen();
        toogleCodeView();
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
        toogleCodeView();
        break;
      case "Design":
        toogleActionsPanel();
        break;
      case "Guide":
        openGuidePage();
        break;
      case "Download":
        onDownload();
        break;
      default:
        return;
    }
  }, [currentCommand]);
  // -------------------------------------------------------------- handlers --------------------------------------------------------------
  const clearSession = useCallback(() => {
    //dispatch(clearMainState());//TODO: clearMainState
    dispatch({ type: FileTree_Event_ClearActionType });
    dispatch({ type: NodeTree_Event_ClearActionType });
  }, []);
  const loadProject = useCallback(
    async (
      fsType: TProjectContext,
      projectHandle?: FileSystemHandle | null,
      internal?: boolean,
    ) => {
      dispatch(setFavicon(""));
      if (fsType === "local") {
        dispatch(setDoingFileAction(true));
        try {
          // configure idb on nohost
          const handlerObj = await loadLocalProject(
            projectHandle as FileSystemDirectoryHandle,
            osType,
          );

          clearSession(); /* file treeview error fix when the switching project by navigator */

          setTimeout(async () => {
            // sort by ASC directory/file
            Object.keys(handlerObj).map((uid) => {
              const handler = handlerObj[uid];
              handler.children = handler.children.sort((a, b) => {
                return handlerObj[a].kind === "file" &&
                  handlerObj[b].kind === "directory"
                  ? 1
                  : handlerObj[a].kind === "directory" &&
                    handlerObj[b].kind === "file"
                  ? -1
                  : handlerObj[a].name > handlerObj[b].name
                  ? 1
                  : -1;
              });
            });

            // get/set the index/first html to be opened by default
            let firstHtmlUid: TNodeUid = "",
              indexHtmlUid: TNodeUid = "";
            handlerObj[RootNodeUid].children.map((uid) => {
              const handler = handlerObj[uid];
              if (handler.kind === "file" && handler.ext === ".html") {
                firstHtmlUid === "" ? (firstHtmlUid = uid) : null;
                handler.name === "index" ? (indexHtmlUid = uid) : null;
              }
            });

            console.log(handlerObj, firstHtmlUid, indexHtmlUid);

            // set default background
            dispatch(setCurrentFileUid(""));
            dispatch(setNodeTree({}));
            dispatch(setValidNodeTree({}));
            dispatch(setIframeSrc(null));

            const initialFile =
              indexHtmlUid !== ""
                ? indexHtmlUid
                : firstHtmlUid !== ""
                ? firstHtmlUid
                : "";

            // hide element panel when there is no index.html
            if (initialFile === "") {
              dispatch(setShowActionsPanel(false));
              dispatch(setNavigatorDropdownType(null));
            }

            console.log({ initialFile });
            dispatch(setInitialFileUidToOpen(initialFile));

            // set ff-tree, ff-handlers
            const treeViewData: TNodeTreeData = {};
            const ffHandlerObj: TFileHandlerCollection = {};
            Object.keys(handlerObj).map((uid) => {
              const {
                parentUid,
                children,
                path,
                kind,
                name,
                ext,
                content,
                handler,
              } = handlerObj[uid];
              const type = ParsableFileTypes[ext || ""]
                ? ext?.slice(1)
                : "unknown";
              treeViewData[uid] = {
                uid,
                parentUid: parentUid,
                displayName: name,
                isEntity: kind === "file",
                children: [...children],
                data: {
                  valid: true,
                  path: path,
                  kind: kind,
                  name: name,
                  ext: ext,
                  type,
                  orgContent: content?.toString(),
                  content: content?.toString(),
                  changed: false,
                } as TFileNodeData,
              } as TNode;

              ffHandlerObj[uid] = handler;
            });

            dispatch(setFileTree(treeViewData));
            setFileHandlers(ffHandlerObj);

            console.log(treeViewData, ffHandlerObj);

            dispatch(
              setProject({
                context: "local",
                name: (projectHandle as FileSystemDirectoryHandle).name,
                handler: null,
                favicon: null,
              }),
            );
            setCurrentProjectFileHandler(
              projectHandle as FileSystemDirectoryHandle,
            );

            dispatch(setNavigatorDropdownType(null));
            if (internal) {
              // store last edit session
              toogleCodeView();
              const _recentProjectContexts = [...recentProjectContexts];
              const _recentProjectNames = [...recentProjectNames];
              const _recentProjectHandlers = [...recentProjectHandlers];
              for (
                let index = 0;
                index < _recentProjectContexts.length;
                ++index
              ) {
                if (
                  _recentProjectContexts[index] === fsType &&
                  projectHandle?.name === _recentProjectNames[index]
                ) {
                  _recentProjectContexts.splice(index, 1);
                  _recentProjectNames.splice(index, 1);
                  _recentProjectHandlers.splice(index, 1);
                  break;
                }
              }
              if (_recentProjectContexts.length === RecentProjectCount) {
                _recentProjectContexts.pop();
                _recentProjectNames.pop();
                _recentProjectHandlers.pop();
              }
              _recentProjectContexts.unshift(fsType);
              _recentProjectNames.unshift(
                (projectHandle as FileSystemDirectoryHandle).name,
              );
              _recentProjectHandlers.unshift(
                projectHandle as FileSystemDirectoryHandle,
              );
              setRecentProjectContexts(_recentProjectContexts);
              setRecentProjectNames(_recentProjectNames);
              setRecentProjectHandlers(_recentProjectHandlers);
              await setMany([
                ["recent-project-context", _recentProjectContexts],
                ["recent-project-name", _recentProjectNames],
                ["recent-project-handler", _recentProjectHandlers],
              ]);
            }

            // show actions panel by default
            !showActionsPanel && dispatch(setShowActionsPanel(true));
          }, 50);
        } catch (err) {
          LogAllow && console.log("failed to load local project");
        }
        dispatch(setDoingFileAction(false));
      } else if (fsType === "idb") {
        dispatch(setDoingFileAction(true));
        clearSession();
        try {
          const handlerObj = await loadIDBProject(DefaultProjectPath);

          // sort by ASC directory/file
          Object.keys(handlerObj).map((uid) => {
            const handler = handlerObj[uid];
            handler.children = handler.children.sort((a, b) => {
              return handlerObj[a].kind === "file" &&
                handlerObj[b].kind === "directory"
                ? 1
                : handlerObj[a].kind === "directory" &&
                  handlerObj[b].kind === "file"
                ? -1
                : handlerObj[a].name > handlerObj[b].name
                ? 1
                : -1;
            });
          });

          // get/set the index/first html to be opened by default
          let firstHtmlUid: TNodeUid = "",
            indexHtmlUid: TNodeUid = "";
          handlerObj[RootNodeUid].children.map((uid) => {
            const handler = handlerObj[uid];
            if (handler.kind === "file" && handler.ext === ".html") {
              firstHtmlUid === "" ? (firstHtmlUid = uid) : null;
              handler.name === "index" ? (indexHtmlUid = uid) : null;
            }
          });
          dispatch(
            setInitialFileUidToOpen(
              indexHtmlUid !== ""
                ? indexHtmlUid
                : firstHtmlUid !== ""
                ? firstHtmlUid
                : "",
            ),
          );

          // set ff-tree, ff-handlers
          const treeViewData: TNodeTreeData = {};
          const ffHandlerObj: TFileHandlerCollection = {};
          Object.keys(handlerObj).map((uid) => {
            const { parentUid, children, path, kind, name, ext, content } =
              handlerObj[uid];
            const type = ParsableFileTypes[ext || ""]
              ? ext?.slice(1)
              : "unknown";
            treeViewData[uid] = {
              uid,
              parentUid: parentUid,
              displayName: name,
              isEntity: kind === "file",
              children: [...children],
              data: {
                valid: true,
                path: path,
                kind: kind,
                name: name,
                ext: ext,
                type,
                orgContent: type !== "unknown" ? content?.toString() : "",
                content: type !== "unknown" ? content?.toString() : "",
                changed: false,
              } as TFileNodeData,
            } as TNode;
          });
          dispatch(setFileTree(treeViewData));
          setFileHandlers(ffHandlerObj);
          dispatch(
            setProject({
              context: "idb",
              name: "Untitled",
              handler: null,
              favicon: null,
            }),
          );
          setCurrentProjectFileHandler(null);

          // store last edit session
          // const _recentProjectContexts = [...recentProjectContexts]
          // const _recentProjectNames = [...recentProjectNames]
          // const _recentProjectHandlers = [...recentProjectHandlers]
          // for (let index = 0; index < _recentProjectContexts.length; ++index) {
          //   if (_recentProjectContexts[index] === fsType) {
          //     _recentProjectContexts.splice(index, 1)
          //     _recentProjectNames.splice(index, 1)
          //     _recentProjectHandlers.splice(index, 1)
          //     break
          //   }
          // }
          // if (_recentProjectContexts.length === RecentProjectCount) {
          //   _recentProjectContexts.pop()
          //   _recentProjectNames.pop()
          //   _recentProjectHandlers.pop()
          // }
          // _recentProjectContexts.unshift(fsType)
          // _recentProjectNames.unshift('Untitled')
          // _recentProjectHandlers.unshift(null)
          // setRecentProjectContexts(_recentProjectContexts)
          // setRecentProjectNames(_recentProjectNames)
          // setRecentProjectHandlers(_recentProjectHandlers)
          // await setMany([['recent-project-context', _recentProjectContexts], ['recent-project-name', _recentProjectNames], ['recent-project-handler', _recentProjectHandlers]])
        } catch (err) {
          LogAllow && console.log("failed to load Untitled project");
        }
        dispatch(setDoingFileAction(false));
      }
    },
    [
      clearSession,
      osType,
      recentProjectContexts,
      recentProjectNames,
      recentProjectHandlers,
      fileTree,
    ],
  );
  const onImportProject = useCallback(
    async (fsType: TProjectContext = "local"): Promise<void> => {
      return new Promise<void>(async (resolve, reject) => {
        if (fsType === "local") {
          try {
            const projectHandle = await showDirectoryPicker({
              _preferPolyfill: false,
              mode: "readwrite",
            } as CustomDirectoryPickerOptions);
            await loadProject(fsType, projectHandle, true);
          } catch (err) {
            reject(err);
          }
        } else if (fsType === "idb") {
          try {
            await loadProject(fsType, null, true);
          } catch (err) {
            reject(err);
          }
        }
        resolve();
      });
    },
    [loadProject],
  );
  // open
  const onOpen = useCallback(async () => {
    if (fileTree) {
      // confirm files' changes
      let hasChangedFile = false;
      for (let x in fileTree) {
        const _file = fileTree[x];
        const _fileData = _file.data as TFileNodeData;
        if (_file && _fileData.changed) {
          hasChangedFile = true;
        }
      }
      if (hasChangedFile) {
        const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
        if (!window.confirm(message)) {
          return;
        }
      }
    }

    dispatch(setDoingFileAction(true));
    try {
      await onImportProject();
    } catch (err) {
      LogAllow && console.log("failed to open project");
    }
    dispatch(setDoingFileAction(false));
  }, [onImportProject, fileTree]);
  // new
  const onNew = useCallback(async () => {
    if (fileTree) {
      // confirm if ffTree is changed
      let hasChangedFile = false;
      for (let x in fileTree) {
        const _file = fileTree[x];
        const _fileData = _file.data as TFileNodeData;
        if (_file && _fileData.changed) {
          hasChangedFile = true;
        }
      }
      if (hasChangedFile) {
        const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
        if (!window.confirm(message)) {
          return;
        }
      }
    }

    dispatch(setDoingFileAction(true));
    try {
      await initIDBProject(DefaultProjectPath);
      await onImportProject("idb");
    } catch (err) {
      LogAllow && console.log("failed to init/load Untitled project");
    }
    dispatch(setDoingFileAction(false));
  }, [onImportProject, fileTree]);
  // actions
  const onActions = useCallback(() => {
    if (cmdkOpen) return;
    dispatch(setCmdkPages(["Actions"]));
    dispatch(setCmdkOpen(true));
  }, [cmdkOpen]);
  // add
  const onAdd = useCallback(() => {
    setCmdkPages([...cmdkPages, "Add"]);
    setCmdkOpen(true);
  }, [cmdkPages]);
  // download
  const onDownload = useCallback(async () => {
    if (project.context !== "idb") return;

    try {
      await downloadProject(DefaultProjectPath);
    } catch (err) {
      LogAllow && console.log("failed to download project");
    }
  }, [project.context]);
  // clear
  const onClear = useCallback(async () => {
    // remove localstorage and session
    window.localStorage.clear();
    await delMany([
      "recent-project-context",
      "recent-project-name",
      "recent-project-handler",
    ]);
  }, []);
  // jumpstart
  const onJumpstart = useCallback(() => {
    if (cmdkOpen) return;
    dispatch(setCmdkPages(["Jumpstart"]));
    dispatch(setCmdkOpen(true));
  }, [cmdkOpen]);

  // open navigator when close the menu
  const firstLoaded = useRef(0);
  useEffect(() => {
    if (!cmdkOpen && firstLoaded.current === 2 && !showActionsPanel) {
      dispatch(setShowActionsPanel(true));
    }
    ++firstLoaded.current;
  }, [cmdkOpen]);

  // close all panel
  const closeAllPanel = useCallback(() => {
    dispatch(setShowActionsPanel(false));
    dispatch(setShowCodeView(false));
  }, []);

  // hms
  const onUndo = useCallback(() => {
    if (
      doingAction ||
      iframeLoading ||
      doingFileAction ||
      codeEditing ||
      !parseFileFlag
    )
      return;

    LogAllow &&
      fileEventPastLength === 1 &&
      console.log("hms - it is the origin state");
    if (fileEventPastLength === 1) return;

    dispatch(setDidUndo(true));

    dispatch({ type: "main/undo" });
    dispatch(setUpdateOptions({ parse: true, from: "hms" }));
  }, [
    doingAction,
    iframeLoading,
    doingFileAction,
    codeEditing,
    fileEventPastLength,
    fileAction,
    currentFileUid,
  ]);
  const onRedo = useCallback(() => {
    if (
      doingAction ||
      iframeLoading ||
      doingFileAction ||
      codeEditing ||
      !parseFileFlag
    )
      return;

    LogAllow &&
      fileEventFutureLength === 0 &&
      console.log("hms - it is the latest state");
    if (fileEventFutureLength === 0) return;

    dispatch(setFileAction(fileAction));
    dispatch({ type: "main/redo" });
    dispatch(setUpdateOptions({ parse: true, from: "hms" }));
  }, [
    doingAction,
    iframeLoading,
    doingFileAction,
    codeEditing,
    fileEventFutureLength,
    currentFileUid,
  ]);

  useEffect(() => {
    // reset fileAction in the new history
    fileEventFutureLength === 0 &&
      fileAction.type !== null &&
      dispatch(setFileAction({ type: null }));
  }, []);

  // toogle code view
  const toogleCodeView = useCallback(() => {
    dispatch(setShowCodeView(!showCodeView));
    setNewFocusedNodeUid(nFocusedItem);
  }, [showCodeView, nFocusedItem]);
  // toogle actions panel
  const toogleActionsPanel = useCallback(() => {
    dispatch(setShowActionsPanel(!showActionsPanel));
  }, [showActionsPanel]);
  // open guide page
  const openGuidePage = useCallback(() => {
    window.open("https://guide.rnbw.dev", "_blank", "noreferrer");
  }, [currentCommand]);
  // -------------------------------------------------------------- pos/size for panels --------------------------------------------------------------
  const [actionsPanelOffsetTop, setActionsPanelOffsetTop] = useState(12);
  const [actionsPanelOffsetLeft, setActionsPanelOffsetLeft] = useState(12);
  const [actionsPanelWidth, setActionsPanelWidth] = useState(240);

  const [codeViewOffsetBottom, setCodeViewOffsetBottom] = useState("12");
  const [codeViewOffsetTop, setCodeViewOffsetTop] =
    useState("calc(60vh - 12px)");
  const [codeViewOffsetLeft, setCodeViewOffsetLeft] = useState(12);
  const [codeViewHeight, setCodeViewHeight] = useState("40");
  const [codeViewDragging, setCodeViewDragging] = useState(false);
  // -------------------------------------------------------------- other --------------------------------------------------------------
  // detect OS & fetch reference - html. Jumpstart.csv, Actions.csv - restore recent project session - open Untitled project and jumpstart menu ons tartup
  useEffect(() => {
    (async () => {
      addRunningActions([
        "detect-os",
        "reference-files",
        "reference-html-elements",
        "reference-cmdk-jumpstart",
        "reference-cmdk-actions",
      ]);

      // detect os
      LogAllow && console.log("navigator: ", navigator.userAgent);
      if (navigator.userAgent.indexOf("Mac OS X") !== -1) {
        dispatch(setOsType("Mac"));
      } else if (navigator.userAgent.indexOf("Linux") !== -1) {
        dispatch(setOsType("Linux"));
      } else {
        dispatch(setOsType("Windows"));
      }

      // reference-files
      const _filesReferenceData: TFilesReferenceData = {};
      filesRef.map((fileRef: TFilesReference) => {
        _filesReferenceData[fileRef.Extension] = fileRef;
      });
      setFilesReferenceData(_filesReferenceData);
      LogAllow && console.log("files reference data: ", _filesReferenceData);

      // reference-html-elements
      const htmlElementsReferenceData: THtmlElementsReferenceData = {};
      htmlRefElements.map((htmlRefElement: THtmlElementsReference) => {
        const pureTag =
          htmlRefElement["Name"] === "Comment"
            ? "comment"
            : htmlRefElement["Tag"]?.slice(1, htmlRefElement["Tag"].length - 1);
        htmlElementsReferenceData[pureTag] = htmlRefElement;
      });
      LogAllow &&
        console.log(
          "html elements reference data: ",
          htmlElementsReferenceData,
        );
      setHtmlReferenceData({ elements: htmlElementsReferenceData });

      // add default cmdk actions
      const _cmdkReferenceData: TCmdkReferenceData = {};
      addDefaultCmdkActions(_cmdkReferenceData);

      // reference-cmdk-jumpstart
      const _cmdkRefJumpstartData: TCmdkGroupData = {};
      await Promise.all(
        cmdkRefJumpstart.map(async (command: TCmdkReference) => {
          const keys: string[] = (command["Keyboard Shortcut"] as string)
            ?.replace(/ /g, "")
            .split("+");
          const keyObj: TCmdkKeyMap = {
            cmd: false,
            shift: false,
            alt: false,
            key: "",
            click: false,
          };
          keys?.map((key) => {
            if (
              key === "cmd" ||
              key === "shift" ||
              key === "alt" ||
              key === "click"
            ) {
              keyObj[key] = true;
            } else {
              keyObj.key = key;
            }
          });

          const _command: TCmdkReference = JSON.parse(JSON.stringify(command));
          _command["Keyboard Shortcut"] = keyObj;

          const groupName = _command["Group"];
          if (_cmdkRefJumpstartData[groupName] !== undefined) {
            _cmdkRefJumpstartData[groupName].push(_command);
          } else {
            _cmdkRefJumpstartData[groupName] = [_command];
          }
          if (
            groupName === "Projects" &&
            _cmdkRefJumpstartData["Recent"] === undefined
          ) {
            _cmdkRefJumpstartData["Recent"] = [];
            // restore last edit session
            try {
              const sessionInfo = await getMany([
                "recent-project-context",
                "recent-project-name",
                "recent-project-handler",
              ]);
              if (sessionInfo[0] && sessionInfo[1] && sessionInfo[2]) {
                const _session: TSession = {
                  "recent-project-context": sessionInfo[0],
                  "recent-project-name": sessionInfo[1],
                  "recent-project-handler": sessionInfo[2],
                };
                setRecentProjectContexts(_session["recent-project-context"]);
                setRecentProjectNames(_session["recent-project-name"]);
                setRecentProjectHandlers(_session["recent-project-handler"]);

                for (
                  let index = 0;
                  index < _session["recent-project-context"].length;
                  ++index
                ) {
                  const _recentProjectCommand = {
                    Name: _session["recent-project-name"][index],
                    Icon: "folder",
                    Description: "",
                    "Keyboard Shortcut": {
                      cmd: false,
                      shift: false,
                      alt: false,
                      key: "",
                      click: false,
                    },
                    Group: "Recent",
                    Context: index.toString(),
                  } as TCmdkReference;
                  _cmdkRefJumpstartData["Recent"].push(_recentProjectCommand);
                }
                LogAllow && console.log("last session loaded", _session);
              } else {
                LogAllow && console.log("has no last session");
              }
            } catch (err) {
              LogAllow && console.log("failed to load last session");
            }
          }

          _cmdkReferenceData[_command["Name"]] = _command;
        }),
      );

      // if (_cmdkRefJumpstartData['Recent'].length === 0) {
      //   delete _cmdkRefJumpstartData['Recent']
      // }
      setCmdkReferenceJumpstart(_cmdkRefJumpstartData);
      LogAllow &&
        console.log("cmdk jumpstart reference data: ", _cmdkRefJumpstartData);

      // reference-cmdk-actions
      const _cmdkRefActionsData: TCmdkGroupData = {};
      cmdkRefActions.map((command: TCmdkReference) => {
        const contexts: TCmdkContextScope[] = (command["Context"] as string)
          ?.replace(/ /g, "")
          .split(",")
          .map((scope: string) => scope as TCmdkContextScope);
        const contextObj: TCmdkContext = {
          all: false,
          file: false,
          html: false,
        };
        contexts?.map((context: TCmdkContextScope) => {
          contextObj[context] = true;
        });

        const keys: string[] = (command["Keyboard Shortcut"] as string)
          ?.replace(/ /g, "")
          .split("+");
        const keyObj: TCmdkKeyMap = {
          cmd: false,
          shift: false,
          alt: false,
          key: "",
          click: false,
        };
        keys?.map((key: string) => {
          if (
            key === "cmd" ||
            key === "shift" ||
            key === "alt" ||
            key === "click"
          ) {
            keyObj[key] = true;
          } else {
            keyObj.key = key;
          }
        });

        const _command: TCmdkReference = JSON.parse(JSON.stringify(command));
        _command["Context"] = contextObj;
        _command["Keyboard Shortcut"] = keyObj;

        const groupName = _command["Group"];
        if (_cmdkRefActionsData[groupName] !== undefined) {
          _cmdkRefActionsData[groupName].push(_command);
        } else {
          _cmdkRefActionsData[groupName] = [_command];
        }

        _cmdkReferenceData[_command["Name"]] = _command;
      });
      setCmdkReferenceActions(_cmdkRefActionsData);
      LogAllow &&
        console.log("cmdk actions reference data: ", _cmdkRefActionsData);

      // set cmdk map
      setCmdkReferenceData(_cmdkReferenceData);
      LogAllow && console.log("cmdk map: ", _cmdkReferenceData);

      removeRunningActions([
        "detect-os",
        "reference-files",
        "reference-html-elements",
        "reference-cmdk-jumpstart",
        "reference-cmdk-actions",
      ]);
    })();
  }, []);
  useEffect(() => {
    // wait until "cmdkReferenceJumpstart" is ready
    Object.keys(cmdkReferenceJumpstart).length !== 0 && onJumpstart();
  }, [cmdkReferenceJumpstart]);
  // newbie flag
  useEffect(() => {
    const isNewbie = localStorage.getItem("newbie");
    LogAllow && console.log("isNewbie: ", isNewbie === null ? true : false);
    if (!isNewbie) {
      localStorage.setItem("newbie", "false");
      // init/open Untitled project
      (async () => {
        dispatch(setDoingFileAction(true));
        try {
          await initIDBProject(DefaultProjectPath);
          await onImportProject("idb");
          LogAllow && console.log("inited/loaded Untitled project");
        } catch (err) {
          LogAllow && console.log("failed to init/load Untitled project");
        }
        dispatch(setDoingFileAction(false));
      })();
    }
    // always show default project when do refresh
    else {
      onNew();
    }

    // set initial codeview height & offset
    // const offsetTop = localStorage.getItem("offsetTop")
    // const codeViewHeight = localStorage.getItem("codeViewHeight")
    // if (offsetTop) {
    //   setCodeViewOffsetTop(offsetTop)
    // }
    // else {
    //   setCodeViewOffsetTop('66')
    // }
  }, []);
  // theme
  const setSystemTheme = useCallback(() => {
    dispatch(setTheme("System"));
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);
  const onToggleTheme = useCallback(() => {
    switch (theme) {
      case "System":
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
        dispatch(setTheme("Light"));
        setTheme("Light");
        break;
      case "Light":
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        dispatch(setTheme("Dark"));
        break;
      case "Dark":
        document.documentElement.removeAttribute("data-theme");
        localStorage.removeItem("theme");
        setSystemTheme();
        break;
      default:
        break;
    }
  }, [theme]);
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    LogAllow && console.log("storedTheme: ", storedTheme);
    if (storedTheme) {
      document.documentElement.setAttribute("data-theme", storedTheme);
      dispatch(setTheme(storedTheme === "dark" ? "Dark" : "Light"));
    } else {
      setSystemTheme();
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", setSystemTheme);
    }

    return () =>
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", setSystemTheme);
  }, []);
  // web-tab close event handler
  useEffect(() => {
    let changed = false;

    const uids = Object.keys(fileTree);
    for (const uid of uids) {
      const node = fileTree[uid];
      const nodeData = node.data as TFileNodeData;

      if (nodeData.changed) {
        changed = true;
        break;
      }
    }

    window.onbeforeunload = changed
      ? () => {
          return "changed";
        }
      : null;

    return () => {
      window.onbeforeunload = null;
    };
  }, [fileTree]);
  // cmdk modal handle
  const [hoveredMenuItemDescription, setHoverMenuItemDescription] = useState<
    string | null | undefined
  >();
  const [validMenuItemCount, setValidMenuItemCount] = useState<number>();
  useEffect(() => {
    let hoveredMenuItemDetecter: NodeJS.Timeout;
    if (cmdkOpen) {
      // detect hovered menu item in cmdk modal if its open
      hoveredMenuItemDetecter = setInterval(() => {
        const menuItems = document.querySelectorAll(".rnbw-cmdk-menu-item");
        setValidMenuItemCount(menuItems.length);

        const description =
          currentCmdkPage === "Add" || currentCmdkPage === "Jumpstart"
            ? document
                .querySelector('.rnbw-cmdk-menu-item[aria-selected="true"]')
                ?.getAttribute("rnbw-cmdk-menu-item-description")
            : "";
        setHoverMenuItemDescription(description);
      }, 10);
    } else {
      // clear cmdk pages and search text when close the modal
      dispatch(setCmdkPages([]));
      dispatch(setCmdkSearchContent(""));
      // setValidMenuItemCount(undefined)
    }

    return () => clearInterval(hoveredMenuItemDetecter);
  }, [cmdkOpen]);
  // file changed - reload the monaco-editor to clear history
  const [needToReloadCodeView, setNeedToReloadCodeView] = useState(false);
  useEffect(() => {
    setNeedToReloadCodeView(true);
  }, [currentFileUid]);
  useEffect(() => {
    setNeedToReloadCodeView(false);
  }, [needToReloadCodeView]);

  // drag & dragend code view event
  const dragCodeView = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setCodeViewOffsetTop(
      ((e.clientY / document.documentElement.clientHeight) * 100 < 1
        ? 1
        : (e.clientY / document.documentElement.clientHeight) * 100
      ).toString(),
    );
    if (!codeViewDragging) {
      setCodeViewDragging(true);
    }
  }, []);

  const dragEndCodeView = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const offsetTop = (
      (e.clientY / document.documentElement.clientHeight) * 100 < 1
        ? 1
        : (e.clientY / document.documentElement.clientHeight) * 100
    ).toString();
    setCodeViewOffsetTop(offsetTop);
    setCodeViewDragging(false);
    localStorage.setItem("offsetTop", offsetTop);
  }, []);

  const dropCodeView = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);
  // close navigator
  const onCloseDropDown = useCallback(() => {
    navigatorDropdownType !== null && dispatch(setNavigatorDropdownType(null));
  }, [navigatorDropdownType]);

  return (
    <>
      <MainContext.Provider
        value={{
          addRunningActions,
          removeRunningActions,

          filesReferenceData,
          htmlReferenceData,
          cmdkReferenceData,

          currentProjectFileHandler,
          setCurrentProjectFileHandler,

          fileHandlers,
          setFileHandlers,

          // code view
          isContentProgrammaticallyChanged,
          setIsContentProgrammaticallyChanged,
          codeChanges,
          setCodeChanges,
          newFocusedNodeUid,
          setNewFocusedNodeUid,
          setCodeViewOffsetTop,

          // load project
          loadProject,
          // non html editable
          parseFileFlag,
          setParseFile,
          prevFileUid,
          setPrevFileUid,
          // close all panel
          closeAllPanel,
          monacoEditorRef,
          setMonacoEditorRef,
        }}
      >
        <Processor />

        <div
          id="MainPage"
          className={"view background-primary"}
          style={{ display: "relative" }}
          onClick={onCloseDropDown}
        >
          <StageView />
          <ActionsPanel
            top={actionsPanelOffsetTop}
            left={actionsPanelOffsetLeft}
            width={`${actionsPanelWidth}px`}
            height={`calc(100vh - ${actionsPanelOffsetTop * 2}px)`}
          />
          {!needToReloadCodeView ? (
            <CodeView
              offsetTop={`${codeViewOffsetTop}`}
              offsetBottom={codeViewOffsetBottom}
              offsetLeft={
                showActionsPanel
                  ? actionsPanelOffsetLeft * 2 + actionsPanelWidth
                  : codeViewOffsetLeft
              }
              width={`calc(100vw - ${
                (showActionsPanel
                  ? actionsPanelWidth + actionsPanelOffsetLeft * 2
                  : codeViewOffsetLeft) + codeViewOffsetLeft
              }px)`}
              height={`${codeViewHeight}vh`}
              dropCodeView={dropCodeView}
              dragCodeView={dragCodeView}
              dragEndCodeView={dragEndCodeView}
              codeViewDragging={codeViewDragging}
            />
          ) : null}
        </div>

        <Command.Dialog
          open={cmdkOpen}
          className="background-primary radius-s shadow border"
          onOpenChange={(open: boolean) => dispatch(setCmdkOpen(open))}
          onKeyDown={(e: React.KeyboardEvent) => {
            const cmdk: TCmdkKeyMap = {
              cmd: getCommandKey(e as unknown as KeyboardEvent, osType),
              shift: e.shiftKey,
              alt: e.altKey,
              key: e.code,
              click: false,
            };
            if (cmdk.shift && cmdk.cmd && cmdk.key === "KeyR") {
              onClear();
            }
            if (
              e.code === "Escape" ||
              (e.code === "Backspace" && !cmdkSearchContent)
            ) {
              if (e.code === "Escape" && cmdkPages.length === 1) {
                dispatch(setCmdkPages([]));
                dispatch(setCmdkOpen(false));
              } else {
                cmdkPages.length !== 1 &&
                  dispatch(setCmdkPages(cmdkPages.slice(0, -1)));
              }
            }
            e.stopPropagation();
          }}
          filter={(value: string, search: string) => {
            return value.includes(search) !== false ? 1 : 0;
          }}
          loop={true}
          label={currentCmdkPage}
        >
          {/* search input */}
          <div
            className={cx(
              "gap-m box-l padding-m justify-start",
              validMenuItemCount === 0 ? "" : "border-bottom",
            )}
          >
            <Command.Input
              value={cmdkSearchContent}
              onValueChange={(str: string) =>
                dispatch(setCmdkSearchContent(str))
              }
              className="justify-start padding-s gap-s text-l background-primary"
              placeholder={
                currentCmdkPage === "Jumpstart"
                  ? "Jumpstart..."
                  : currentCmdkPage === "Actions"
                  ? "Do something..."
                  : currentCmdkPage === "Add"
                  ? "Add something..."
                  : ""
              }
            />
          </div>

          {/* modal content */}
          <div
            className={
              currentCmdkPage !== "Add" && currentCmdkPage !== "Jumpstart"
                ? ""
                : "box-l direction-column align-stretch box"
            }
            style={{
              ...(currentCmdkPage !== "Add" && currentCmdkPage !== "Jumpstart"
                ? { width: "100%" }
                : {}),
              ...(validMenuItemCount === 0
                ? { height: "0px", overflow: "hidden" }
                : {}),
            }}
          >
            {/* menu list - left panel */}
            <div className="padding-m box">
              <div className="direction-row align-stretch">
                <Command.List
                  style={{
                    maxHeight: "600px",
                    overflow: "auto",
                    width: "100%",
                  }}
                >
                  {/* <Command.Loading>Fetching commands reference data...</Command.Loading> */}

                  {/* <Command.Empty>No results found for "{cmdkSearch}".</Command.Empty> */}

                  {Object.keys(
                    currentCmdkPage === "Jumpstart"
                      ? cmdkReferenceJumpstart
                      : currentCmdkPage === "Actions"
                      ? cmdkReferenceActions
                      : currentCmdkPage === "Add"
                      ? cmdkReferenceAdd
                      : {},
                  ).map((groupName: string) => {
                    let groupNameShow: boolean = false;
                    (currentCmdkPage === "Jumpstart"
                      ? groupName !== "Recent"
                        ? cmdkReferenceJumpstart[groupName]
                        : cmdkReferneceRecentProject
                      : currentCmdkPage === "Actions"
                      ? cmdkReferenceActions[groupName]
                      : currentCmdkPage === "Add"
                      ? cmdkReferenceAdd[groupName]
                      : []
                    ).map((command: TCmdkReference) => {
                      const context: TCmdkContext =
                        command.Context as TCmdkContext;
                      groupNameShow =
                        currentCmdkPage === "Jumpstart" ||
                        (currentCmdkPage === "Actions" &&
                          (command.Name === "Add" ||
                            context.all === true ||
                            (activePanel === "file" &&
                              (context["file"] === true || false)) ||
                            ((activePanel === "node" ||
                              activePanel === "stage") &&
                              ((fileTree[currentFileUid] &&
                                (fileTree[currentFileUid].data as TFileNodeData)
                                  .ext === "html" &&
                                context["html"] === true) ||
                                false)))) ||
                        currentCmdkPage === "Add";
                    });

                    return (
                      <Command.Group
                        key={groupName}
                        // heading={groupName}
                        value={groupName}
                      >
                        {/* group heading label */}
                        {groupNameShow ? (
                          <div className="padding-m gap-s">
                            <span className="text-s opacity-m">
                              {groupName}
                            </span>
                          </div>
                        ) : (
                          <></>
                        )}
                        {(currentCmdkPage === "Jumpstart"
                          ? groupName !== "Recent"
                            ? cmdkReferenceJumpstart[groupName]
                            : cmdkReferneceRecentProject
                          : currentCmdkPage === "Actions"
                          ? cmdkReferenceActions[groupName]
                          : currentCmdkPage === "Add"
                          ? cmdkReferenceAdd[groupName]
                          : []
                        ).map((command: TCmdkReference, index) => {
                          const context: TCmdkContext =
                            command.Context as TCmdkContext;
                          const show: boolean =
                            currentCmdkPage === "Jumpstart" ||
                            (currentCmdkPage === "Actions" &&
                              (command.Name === "Add" ||
                                context.all === true ||
                                (activePanel === "file" &&
                                  (context["file"] === true || false)) ||
                                ((activePanel === "node" ||
                                  activePanel === "stage") &&
                                  ((fileTree[currentFileUid] &&
                                    (
                                      fileTree[currentFileUid]
                                        .data as TFileNodeData
                                    ).ext === "html" &&
                                    context["html"] === true) ||
                                    false)))) ||
                            currentCmdkPage === "Add";

                          return show ? (
                            <Command.Item
                              key={`${command.Name}-${command.Context}-${index}`}
                              value={command.Name + index}
                              className="rnbw-cmdk-menu-item"
                              {...{
                                "rnbw-cmdk-menu-item-description":
                                  command.Description,
                              }}
                              onSelect={() => {
                                console.log("onSelect", command);

                                // keep modal open when toogling theme or go "Add" menu from "Actions" menu
                                command.Name !== "Theme" &&
                                  command.Name !== "Add" &&
                                  dispatch(setCmdkOpen(false));

                                if (command.Name === "Guide") {
                                  guideRef.current?.click();
                                } else if (command.Group === "Add") {
                                  dispatch(
                                    setCurrentCommand({
                                      action: `${AddActionPrefix}-${command.Context}`,
                                    }),
                                  );
                                } else if (
                                  currentCmdkPage === "Jumpstart" &&
                                  command.Group === "Recent"
                                ) {
                                  const index = Number(command.Context);
                                  const projectContext =
                                    recentProjectContexts[index];
                                  const projectHandler =
                                    recentProjectHandlers[index];
                                  if (fileTree) {
                                    // confirm files' changes
                                    let hasChangedFile = false;
                                    for (let x in fileTree) {
                                      const _file = fileTree[x];
                                      const _fileData =
                                        _file.data as TFileNodeData;
                                      if (_file && _fileData.changed) {
                                        hasChangedFile = true;
                                      }
                                    }
                                    if (hasChangedFile) {
                                      const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`;
                                      if (!window.confirm(message)) {
                                        return;
                                      }
                                    }
                                  }
                                  loadProject(
                                    projectContext,
                                    projectHandler,
                                    true,
                                  );
                                } else if (
                                  currentCmdkPage === "Add" &&
                                  command.Group === "Recent"
                                ) {
                                } else {
                                  dispatch(
                                    setCurrentCommand({ action: command.Name }),
                                  );
                                }
                              }}
                            >
                              <div className="justify-stretch padding-s align-center">
                                <div className="gap-s align-center">
                                  {/* detect Theme Group and render check boxes */}
                                  {currentCmdkPage === "Jumpstart" &&
                                  command.Name === "Theme" ? (
                                    <>
                                      <div className="padding-xs">
                                        <div className="radius-m icon-xs align-center background-tertiary"></div>
                                      </div>
                                      <div className="gap-s align-center">
                                        <span className="text-m opacity-m">
                                          Theme
                                        </span>
                                        <span className="text-s opacity-m">
                                          /
                                        </span>
                                        <span className="text-m">{theme}</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="padding-xs">
                                        {typeof command.Icon === "string" &&
                                        command["Icon"] !== "" ? (
                                          <SVGIcon {...{ class: "icon-xs" }}>
                                            {command["Icon"]}
                                          </SVGIcon>
                                        ) : (
                                          <div className="icon-xs"></div>
                                        )}
                                      </div>
                                      <span className="text-m">
                                        {command["Name"]}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="gap-s">
                                  {(command["Keyboard Shortcut"] as TCmdkKeyMap)
                                    .cmd && <span className="text-m">⌘</span>}
                                  {(command["Keyboard Shortcut"] as TCmdkKeyMap)
                                    .shift && <span className="text-m">⇧</span>}
                                  {(command["Keyboard Shortcut"] as TCmdkKeyMap)
                                    .alt && <span className="text-m">Alt</span>}
                                  {command["Keyboard Shortcut"] !== undefined &&
                                    (
                                      command[
                                        "Keyboard Shortcut"
                                      ] as TCmdkKeyMap
                                    ).key !== "" && (
                                      <span className="text-m">
                                        {(
                                          command[
                                            "Keyboard Shortcut"
                                          ] as TCmdkKeyMap
                                        ).key[0].toUpperCase() +
                                          (
                                            command[
                                              "Keyboard Shortcut"
                                            ] as TCmdkKeyMap
                                          ).key.slice(1)}
                                      </span>
                                    )}
                                  {(command["Keyboard Shortcut"] as TCmdkKeyMap)
                                    .click && (
                                    <span className="text-m">Click</span>
                                  )}
                                </div>
                              </div>
                            </Command.Item>
                          ) : null;
                        })}
                      </Command.Group>
                    );
                  })}
                </Command.List>
              </div>
            </div>
            {/* Guide link */}
            <a
              style={{ display: "none" }}
              href="https://guide.rnbw.dev"
              target="_blank"
              ref={guideRef}
            ></a>
            {/* description - right panel */}
            {(currentCmdkPage === "Add" || currentCmdkPage === "Jumpstart") &&
              false && (
                <div
                  className={cx(
                    "box align-center border-left padding-l text-l",
                    !!hoveredMenuItemDescription ? "" : "opacity-m",
                  )}
                >
                  {!!hoveredMenuItemDescription
                    ? hoveredMenuItemDescription
                    : "Description"}
                </div>
              )}
          </div>
        </Command.Dialog>
      </MainContext.Provider>
    </>
  );
}
