import { useEffect, useMemo, useState } from "react";

import { getMany } from "idb-keyval";

import { LogAllow } from "@_constants/global";
import { useAppState } from "@_redux/useAppState";

//@ts-expect-error csv files
import cmdkRefActions from "@_ref/cmdk.ref/Actions.csv";
//@ts-expect-error csv files
import cmdkRefJumpstart from "@_ref/cmdk.ref/Jumpstart.csv";
//@ts-expect-error csv files
import filesRef from "@_ref/rfrncs/Files.csv";
import {
  TCmdkContext,
  TCmdkContextScope,
  TCmdkGroupData,
  TCmdkReference,
  TCmdkReferenceData,
  THtmlReferenceData,
  TSession,
} from "@_types/main";

import {
  addDefaultCmdkActions,
  elementsCmdk,
  fileCmdk,
  getKeyObjectsFromCommand,
} from "../helper";
import { useDispatch } from "react-redux";
import { setCmdkReferenceData } from "@_redux/main/cmdk";
import {
  setRecentProjectContexts,
  setRecentProjectHandlers,
  setRecentProjectNames,
} from "@_redux/main/project";

interface IUseCmdkReferenceData {
  addRunningActions: (actionNames: string[]) => void;
  removeRunningActions: (actionNames: string[]) => void;
  htmlReferenceData: THtmlReferenceData;
}
export const useCmdkReferenceData = ({
  addRunningActions,
  removeRunningActions,
  htmlReferenceData,
}: IUseCmdkReferenceData) => {
  const dispatch = useDispatch();
  const {
    fileTree,
    fFocusedItem,
    nodeTree,
    nFocusedItem,
    cmdkSearchContent,
    recentProjectNames,
    recentProjectHandlers,
    recentProjectContexts,
  } = useAppState();

  const [cmdkReferenceJumpstart, setCmdkReferenceJumpstart] =
    useState<TCmdkGroupData>({});
  const [cmdkReferenceActions, setCmdkReferenceActions] =
    useState<TCmdkGroupData>({});

  // reference-cmdk
  useEffect(() => {
    (async () => {
      addRunningActions(["reference-cmdk"]);

      // add default cmdk actions
      const _cmdkReferenceData: TCmdkReferenceData = {};
      addDefaultCmdkActions(_cmdkReferenceData);

      // reference-cmdk-jumpstart
      const _cmdkRefJumpstartData: TCmdkGroupData = {};
      await Promise.all(
        cmdkRefJumpstart.map(async (command: TCmdkReference) => {
          const _command = structuredClone(command);
          _command["Keyboard Shortcut"] = getKeyObjectsFromCommand(command);

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
                dispatch(
                  setRecentProjectContexts(_session["recent-project-context"]),
                );
                dispatch(
                  setRecentProjectNames(_session["recent-project-name"]),
                );
                dispatch(
                  setRecentProjectHandlers(_session["recent-project-handler"]),
                );

                for (
                  let index = 0;
                  index < _session["recent-project-context"].length;
                  ++index
                ) {
                  const _recentProjectCommand = {
                    Name: _session["recent-project-name"][index],
                    Icon: "folder",
                    Description: "",
                    "Keyboard Shortcut": [
                      {
                        cmd: false,
                        shift: false,
                        alt: false,
                        key: "",
                        click: false,
                      },
                    ],
                    Group: "Recent",
                    Context: index.toString(),
                  } as TCmdkReference;
                  _cmdkRefJumpstartData["Recent"].push(_recentProjectCommand);
                }
                LogAllow && console.info("last session loaded", _session);
              } else {
                LogAllow && console.log("has no last session");
              }
            } catch (err) {
              LogAllow && console.error("failed to load last session");
            }
          }

          _cmdkReferenceData[_command["Name"]] = _command;
        }),
      );
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
        const keyObjects = getKeyObjectsFromCommand(command);
        const _command: TCmdkReference = structuredClone(command);
        _command["Context"] = contextObj;
        _command["Keyboard Shortcut"] = keyObjects;

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
      dispatch(setCmdkReferenceData(_cmdkReferenceData));
      LogAllow && console.log("cmdk map: ", _cmdkReferenceData);

      removeRunningActions(["reference-cmdk"]);
    })();
  }, []);

  const cmdkReferneceRecentProject = useMemo(() => {
    const _cmdkReferneceRecentProject: TCmdkReference[] = [];
    recentProjectContexts.map((_context, index) => {
      if (_context != "idb") {
        _cmdkReferneceRecentProject.push({
          Name: recentProjectNames[index],
          Icon: "folder",
          Description: "",
          "Keyboard Shortcut": [
            {
              cmd: false,
              shift: false,
              alt: false,
              key: "",
              click: false,
            },
          ],
          Group: "Recent",
          Context: index.toString(),
        });
      }
    });
    return _cmdkReferneceRecentProject;
  }, [recentProjectContexts, recentProjectNames, recentProjectHandlers]);
  const cmdkReferenceAdd = useMemo<TCmdkGroupData>(() => {
    const data: TCmdkGroupData = {
      Files: [],
      Elements: [],
      Recent: [],
    };

    // Files
    fileCmdk({
      fileTree,
      fFocusedItem,
      filesRef,
      data,
      cmdkSearchContent,
      groupName: "Add",
    });

    Object.keys(htmlReferenceData.elements).map((tag: string) => {
      const tagRef = htmlReferenceData.elements[tag];
      if (tagRef !== undefined) {
        data["Elements"].push({
          Featured: tagRef && tagRef.Featured === "Yes" ? true : false,
          Name: tagRef.Name,
          Icon: tagRef.Icon,
          Description: tagRef.Description,
          "Keyboard Shortcut": [
            {
              cmd: false,
              shift: false,
              alt: false,
              key: "",
              click: false,
            },
          ],
          Group: "Add",
          Context: `Node-${tagRef.Tag}`,
        });
      }
    });
    // Recent
    delete data["Recent"];

    return data;
  }, [
    filesRef,
    fileTree,
    fFocusedItem,
    nodeTree,
    nFocusedItem,
    htmlReferenceData,
    cmdkSearchContent,
  ]);
  const cmdkReferenceRename = useMemo<TCmdkGroupData>(() => {
    const data: TCmdkGroupData = {
      Files: [],
      Elements: [],
      Recent: [],
    };

    // Elements
    elementsCmdk({
      nodeTree,
      nFocusedItem,
      htmlReferenceData,
      data,
      groupName: "Turn into",
    });

    // Recent
    delete data["Recent"];

    return data;
  }, [nodeTree, nFocusedItem, htmlReferenceData]);

  return {
    cmdkReferenceJumpstart,
    cmdkReferenceActions,
    cmdkReferneceRecentProject,
    cmdkReferenceAdd,
    cmdkReferenceRename,
  };
};
