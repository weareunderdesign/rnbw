import { useEffect, useMemo, useState } from "react";

import { get } from "idb-keyval";

import { LogAllow } from "@_constants/global";
import { useAppState } from "@_redux/useAppState";

//@ts-expect-error csv files
import cmdkRefActions from "@_ref/cmdk.ref/Actions.csv";
//@ts-expect-error csv files
import cmdkRefJumpstart from "@_ref/cmdk.ref/Jumpstart.csv";
import { filesReferences } from "@rnbws/rfrncs.design";
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
import { setRecentProject } from "@_redux/main/project";
import { addRunningAction, removeRunningAction } from "@_redux/main/processor";

interface IUseCmdkReferenceData {
  htmlReferenceData: THtmlReferenceData;
}
export const useCmdkReferenceData = ({
  htmlReferenceData,
}: IUseCmdkReferenceData) => {
  const dispatch = useDispatch();
  const {
    fileTree,
    fFocusedItem,
    nodeTree,
    validNodeTree,
    nFocusedItem,
    cmdkSearchContent,
    recentProject,
  } = useAppState();

  const [cmdkReferenceJumpstart, setCmdkReferenceJumpstart] =
    useState<TCmdkGroupData>({});
  const [cmdkReferenceActions, setCmdkReferenceActions] =
    useState<TCmdkGroupData>({});

  // reference-cmdk
  useEffect(() => {
    (async () => {
      dispatch(addRunningAction());

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
              const sessionInfo: TSession | undefined =
                await get("recent-project");
              if (sessionInfo) {
                dispatch(setRecentProject(sessionInfo));

                for (let index = 0; index < sessionInfo.length; ++index) {
                  const _recentProjectCommand = {
                    Name: sessionInfo[index].name,
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
                LogAllow && console.info("last session loaded", sessionInfo);
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

      dispatch(removeRunningAction());
    })();
  }, []);

  const cmdkReferenceRecentProject = useMemo(() => {
    const _cmdkReferenceRecentProject: TCmdkReference[] = [];
    recentProject.map(({ context }, index) => {
      if (context != "idb") {
        _cmdkReferenceRecentProject.push({
          Name: recentProject[index].name,
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
    return _cmdkReferenceRecentProject;
  }, [recentProject]);
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
      filesRef: filesReferences,
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
      validNodeTree,
      nFocusedItem,
      htmlReferenceData,
      data,
      groupName: "Turn into",
    });

    // Recent
    delete data["Recent"];

    return data;
  }, [validNodeTree, nFocusedItem, htmlReferenceData]);

  return {
    Jumpstart: cmdkReferenceJumpstart,
    Actions: cmdkReferenceActions,
    Recent: cmdkReferenceRecentProject,
    Add: cmdkReferenceAdd,
    "Turn into": cmdkReferenceRename,
  };
};
