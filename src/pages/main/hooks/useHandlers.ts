import { useCallback, useEffect, useState } from "react";

import { setMany } from "idb-keyval";
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
  TFileHandlerCollection,
} from "@_node/file";
import {
  setCurrentFileUid,
  setDoingFileAction,
  setFileTree,
  setInitialFileUidToOpen,
  setProject,
  TProjectContext,
  updateFileTreeViewState,
} from "@_redux/main/fileTree";
import { setCurrentFileContent } from "@_redux/main/nodeTree";
import {
  setLoadingFalse,
  setLoadingTrue,
  setNavigatorDropdownType,
  setShowActionsPanel,
} from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

import { clearProjectSession } from "../helper";

interface IUseHandlers {
  currentProjectFileHandle: FileSystemDirectoryHandle | null;
  setCurrentProjectFileHandle: React.Dispatch<
    React.SetStateAction<FileSystemDirectoryHandle | null>
  >;
  setFileHandlers: React.Dispatch<React.SetStateAction<TFileHandlerCollection>>;
  recentProjectContexts: TProjectContext[];
  recentProjectNames: string[];
  recentProjectHandlers: (FileSystemDirectoryHandle | null)[];
  setRecentProjectContexts: React.Dispatch<
    React.SetStateAction<TProjectContext[]>
  >;
  setRecentProjectNames: React.Dispatch<React.SetStateAction<string[]>>;
  setRecentProjectHandlers: React.Dispatch<
    React.SetStateAction<(FileSystemDirectoryHandle | null)[]>
  >;
}
export const useHandlers = ({
  currentProjectFileHandle,
  setCurrentProjectFileHandle,
  setFileHandlers,
  recentProjectContexts,
  recentProjectNames,
  recentProjectHandlers,
  setRecentProjectContexts,
  setRecentProjectNames,
  setRecentProjectHandlers,
}: IUseHandlers) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    osType,
    navigatorDropdownType,
    project,
    fileTree,
    currentFileUid,
    webComponentOpen,
  } = useAppState();

  const { "*": rest } = useParams();

  const saveRecentProject = useCallback(
    async (
      fsType: TProjectContext,
      projectHandle: FileSystemDirectoryHandle,
    ) => {
      const _recentProjectContexts = [...recentProjectContexts];
      const _recentProjectNames = [...recentProjectNames];
      const _recentProjectHandlers = [...recentProjectHandlers];
      for (let index = 0; index < _recentProjectContexts.length; ++index) {
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
    },
    [recentProjectContexts, recentProjectNames, recentProjectHandlers],
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
          setCurrentProjectFileHandle(
            projectHandle as FileSystemDirectoryHandle,
          );

          dispatch(setFileTree(_fileTree));
          dispatch(setInitialFileUidToOpen(_initialFileUidToOpen));
          setFileHandlers(_fileHandlers);

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
          setCurrentProjectFileHandle(null);

          dispatch(setFileTree(_fileTree));
          dispatch(setInitialFileUidToOpen(_initialFileUidToOpen));
          setFileHandlers({});

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
        deletedUidsObj,
        deletedUids,
      } = await loadLocalProject(
        currentProjectFileHandle as FileSystemDirectoryHandle,
        osType,
        true,
        fileTree,
      );
      dispatch(setFileTree(_fileTree));
      setFileHandlers(_fileHandlers);
      // need to open another file if the current open file is deleted
      if (deletedUidsObj[currentFileUid] || !currentFileUid) {
        if (!!_initialFileUidToOpen) {
          dispatch(setCurrentFileUid(_initialFileUidToOpen));
          dispatch(
            setCurrentFileContent(
              _fileTree[_initialFileUidToOpen].data.content ||
                getIndexHtmlContent(),
            ),
          );
        } else {
          dispatch(setCurrentFileUid(""));
          dispatch(setCurrentFileContent(""));
        }
      }
      // update file tree view state
      dispatch(updateFileTreeViewState({ deletedUids: deletedUids }));
      // build nohost idb
      buildNohostIDB(
        handlerArr,
        deletedUids.map((uid) => fileTree[uid].data.path),
      );
    } else {
      const { _fileTree, _initialFileUidToOpen, deletedUidsObj, deletedUids } =
        await loadIDBProject(DefaultProjectPath, true, fileTree);
      dispatch(setFileTree(_fileTree));
      // need to open another file if the current open file is deleted
      if (deletedUidsObj[currentFileUid]) {
        if (!!_initialFileUidToOpen) {
          dispatch(setCurrentFileUid(_initialFileUidToOpen));
          dispatch(
            setCurrentFileContent(
              _fileTree[_initialFileUidToOpen].data.content,
            ),
          );
        } else {
          dispatch(setCurrentFileUid(""));
          dispatch(setCurrentFileContent(""));
        }
      }
      // update file tree view state
      dispatch(updateFileTreeViewState({ deletedUids: deletedUids }));
    }
  }, [project, currentProjectFileHandle, osType, fileTree, currentFileUid]);

  const closeNavigator = useCallback(() => {
    if (webComponentOpen) return;
    navigatorDropdownType !== null && dispatch(setNavigatorDropdownType(null));
  }, [navigatorDropdownType]);

  return {
    importProject,
    closeNavigator,
    reloadCurrentProject,
    triggerCurrentProjectReload,
  };
};
