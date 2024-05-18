import { useCallback, useEffect, useState } from "react";

import { set } from "idb-keyval";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { LogAllow } from "@_constants/global";
import {
  DefaultProjectPath,
  RecentProjectCount,
  RootNodeUid,
} from "@_constants/main";
import {
  buildNohostIDB,
  createURLPath,
  getIndexHtmlContent,
  loadIDBProject,
  loadLocalProject,
} from "@_node/file";
import {
  focusFileTreeNode,
  setDoingFileAction,
  setFileTree,
  setInitialFileUidToOpen,
  setProject,
  setRenderableFileUid,
  TProjectContext,
  updateFileTreeViewState,
} from "@_redux/main/fileTree";
import {
  setCurrentFileContent,
  setCurrentFileUid,
} from "@_redux/main/nodeTree";
import {
  setLoadingFalse,
  setLoadingTrue,
  setNavigatorDropdownType,
} from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

import { clearProjectSession } from "../helper";
import {
  setCurrentProjectFileHandle,
  setFileHandlers,
  setRecentProject,
} from "@_redux/main/project";

export const useHandlers = () => {
  const { currentProjectFileHandle } = useAppState();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    osType,
    navigatorDropdownType,
    project,
    fileTree,
    currentFileUid,
    recentProject,
  } = useAppState();

  const { "*": rest } = useParams();

  const saveRecentProject = useCallback(
    async (
      fsType: TProjectContext,
      projectHandle: FileSystemDirectoryHandle,
    ) => {
      const _recentProject = [...recentProject];
      for (let index = 0; index < _recentProject.length; ++index) {
        if (
          _recentProject[index].context === fsType &&
          projectHandle?.name === _recentProject[index].name
        ) {
          _recentProject.splice(index, 1);
          break;
        }
      }
      if (_recentProject.length === RecentProjectCount) {
        _recentProject.pop();
      }
      _recentProject.unshift({
        context: fsType,
        name: projectHandle.name,
        handler: projectHandle,
      });
      dispatch(setRecentProject(_recentProject));
      await set("recent-project", _recentProject);
    },
    [recentProject],
  );

  const importProject = useCallback(
    async (
      fsType: TProjectContext,
      projectHandle?: FileSystemDirectoryHandle | null,
      fromURL?: boolean,
    ) => {
      if (fsType === "local") {
        dispatch(setDoingFileAction(true));
        try {
          const {
            handlerArr,
            _fileHandlers,

            _fileTree,
            _initialFileUidToOpen,
          } = await loadLocalProject(
            projectHandle as FileSystemDirectoryHandle,
            osType,
          );
          dispatch(setLoadingTrue());
          clearProjectSession(dispatch);

          // build nohost idb
          buildNohostIDB(handlerArr);

          dispatch(
            setProject({
              context: "local",
              name: (projectHandle as FileSystemDirectoryHandle).name,
              favicon: null,
            }),
          );
          dispatch(
            setCurrentProjectFileHandle(
              projectHandle as FileSystemDirectoryHandle,
            ),
          );
          // const persistProcessor = JSON.parse(
          //   "" + localStorage.getItem("persist:processor"),
          // );
          // if (persistProcessor.formatCode == "true") {
          //   _fileTree[_initialFileUidToOpen].data.content = html_beautify(
          //     _fileTree[_initialFileUidToOpen].data.content,
          //   );
          // }

          dispatch(setFileTree(_fileTree));
          dispatch(setInitialFileUidToOpen(_initialFileUidToOpen));
          dispatch(setFileHandlers(_fileHandlers));

          await saveRecentProject(
            fsType,
            projectHandle as FileSystemDirectoryHandle,
          );

          const pathURL = createURLPath(
            fromURL ? `${RootNodeUid}/${rest}` : _initialFileUidToOpen,
            RootNodeUid,
            _fileTree[RootNodeUid]?.displayName,
          );
          navigate(pathURL);
        } catch (err) {
          LogAllow && console.log("ERROR while importing local project", err);
        }
        dispatch(setDoingFileAction(false));
        dispatch(setLoadingFalse());
      } else if (fsType === "idb") {
        dispatch(setDoingFileAction(true));
        try {
          const { _fileTree, _initialFileUidToOpen } =
            await loadIDBProject(DefaultProjectPath);

          clearProjectSession(dispatch);

          dispatch(
            setProject({
              context: "idb",
              name: "Welcome",
              favicon: null,
            }),
          );
          dispatch(setCurrentProjectFileHandle(null));

          dispatch(setFileTree(_fileTree));
          dispatch(setInitialFileUidToOpen(_initialFileUidToOpen));
          dispatch(setFileHandlers({}));

          // await saveRecentProject(fsType, null);
        } catch (err) {
          LogAllow && console.log("ERROR while importing IDB project", err);
        }
        dispatch(setDoingFileAction(false));
      }
    },
    [osType, saveRecentProject, rest],
  );

  // current project - reload trigger
  const [reloadCurrentProjectTrigger, setReloadCurrentProjectTrigger] =
    useState(false);

  const triggerCurrentProjectReload = useCallback(() => {
    console.log("triggerCurrentProjectReload");
    setReloadCurrentProjectTrigger((prev) => !prev);
  }, []);

  useEffect(() => {
    reloadCurrentProject();
  }, [reloadCurrentProjectTrigger]);

  const reloadCurrentProject = useCallback(async () => {
    if (project.context === "local") {
      const {
        handlerArr,
        _fileHandlers,
        _fileTree,
        _initialFileUidToOpen,
        deletedUids,
        deletedUidsObj,
      } = await loadLocalProject(
        currentProjectFileHandle as FileSystemDirectoryHandle,
        osType,
        true,
        fileTree,
      );
      dispatch(setFileTree(_fileTree));
      dispatch(setFileHandlers(_fileHandlers));
      // need to open another file if the current open file is deleted

      if (deletedUidsObj[currentFileUid] || !currentFileUid) {
        dispatch(setCurrentFileUid(_initialFileUidToOpen));
        dispatch(setRenderableFileUid(_initialFileUidToOpen));
        dispatch(
          setCurrentFileContent(
            _fileTree[_initialFileUidToOpen].data.content ||
              getIndexHtmlContent(),
          ),
        );
        dispatch(focusFileTreeNode(_initialFileUidToOpen));

        const pathURL = createURLPath(
          _initialFileUidToOpen,
          RootNodeUid,
          _fileTree[RootNodeUid]?.displayName,
        );
        navigate(pathURL);
      } else if (_initialFileUidToOpen == "") {
        dispatch(setCurrentFileUid(""));
        dispatch(setRenderableFileUid(""));
        dispatch(setCurrentFileContent(""));
      } else if (currentFileUid) {
        dispatch(setCurrentFileUid(currentFileUid));
        dispatch(setRenderableFileUid(currentFileUid));
        dispatch(
          setCurrentFileContent(
            _fileTree[currentFileUid].data.content || getIndexHtmlContent(),
          ),
        );
      }
      // update file tree view state
      dispatch(updateFileTreeViewState({ deletedUids: deletedUids }));
      // build nohost idb
      buildNohostIDB(
        handlerArr,
        deletedUids.map((uid) => fileTree[uid].data.path),
      );
    } else {
      try {
        const {
          _fileTree,
          _initialFileUidToOpen,
          deletedUidsObj,
          deletedUids,
        } = await loadIDBProject(DefaultProjectPath, true, fileTree);
        dispatch(setFileTree(_fileTree));
        // need to open another file if the current open file is deleted
        if (deletedUidsObj[currentFileUid]) {
          if (_initialFileUidToOpen !== "") {
            dispatch(setCurrentFileUid(_initialFileUidToOpen));
            dispatch(setRenderableFileUid(_initialFileUidToOpen));
            dispatch(
              setCurrentFileContent(
                _fileTree[_initialFileUidToOpen].data.content,
              ),
            );
          } else {
            dispatch(setCurrentFileUid(""));
            dispatch(setRenderableFileUid(""));
            dispatch(setCurrentFileContent(""));
          }
        }
        // update file tree view state
        dispatch(updateFileTreeViewState({ deletedUids: deletedUids }));
      } catch (err) {
        LogAllow && console.log("ERROR while reloading IDB project", err);
      }
    }
  }, [project, currentProjectFileHandle, osType, fileTree, currentFileUid]);

  const closeNavigator = useCallback(() => {
    navigatorDropdownType !== null && dispatch(setNavigatorDropdownType(null));
  }, [navigatorDropdownType]);

  return {
    importProject,
    closeNavigator,
    reloadCurrentProject,
    triggerCurrentProjectReload,
  };
};
