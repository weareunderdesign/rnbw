import { useCallback } from "react";
import { setMany } from "idb-keyval";
import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { DefaultProjectPath, RecentProjectCount } from "@_constants/main";
import {
  buildNohostIDB,
  loadIDBProject,
  loadLocalProject,
  TFileHandlerCollection,
} from "@_node/file";
import {
  setDoingFileAction,
  setFileTree,
  setInitialFileUidToOpen,
  setProject,
  TProjectContext,
} from "@_redux/main/fileTree";
import {
  setNavigatorDropdownType,
  setShowActionsPanel,
} from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

import { clearProjectSession } from "../helper";

interface IUseHandlers {
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
  const { osType, navigatorDropdownType } = useAppState();

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

          clearProjectSession(dispatch);

          // build nohost idb
          handlerArr && buildNohostIDB(handlerArr);

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
          setFileHandlers(_fileHandlers as TFileHandlerCollection);

          if (_initialFileUidToOpen === "") {
            dispatch(setShowActionsPanel(false));
            dispatch(setNavigatorDropdownType(null));
          }

          await saveRecentProject(
            fsType,
            projectHandle as FileSystemDirectoryHandle,
          );
        } catch (err) {
          LogAllow && console.log("ERROR while importing local project", err);
        }
        dispatch(setDoingFileAction(false));
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
    [osType, saveRecentProject],
  );
  const closeNavigator = useCallback(() => {
    navigatorDropdownType !== null && dispatch(setNavigatorDropdownType(null));
  }, [navigatorDropdownType]);

  return {
    importProject,
    closeNavigator,
  };
};
