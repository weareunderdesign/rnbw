import React, { useCallback, useEffect, useMemo } from "react";
import { Command } from "cmdk";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogAllow } from "@_constants/global";
import { AddActionPrefix, RenameActionPrefix } from "@_constants/main";
import { confirmFileChanges, TFileNodeData } from "@_node/file";
import {
  setCmdkOpen,
  setCmdkPages,
  setCmdkSearchContent,
  setCurrentCommand,
} from "@_redux/main/cmdk";
import { useAppState } from "@_redux/useAppState";
import { TCmdkContext, TCmdkKeyMap, TCmdkReference } from "@_types/main";
import { getCommandKey } from "../../../services/global";
import {
  useCmdk,
  useCmdkModal,
  useCmdkReferenceData,
  useHandlers,
} from "../hooks";
import { CommandItem } from "./CommandItem";

const PLACEHOLDERS = {
  Jumpstart: "Jumpstart...",
  Actions: "Do something...",
  Add: "Add something...",
  "Turn into": "Turn into...",
};

const COMMANDS_TO_KEEP_MODAL_OPEN = [
  "Theme",
  "Autosave",
  "Format Code",
  "Add",
  "Turn into",
  "Word Wrap",
];

export const CommandDialog = () => {
  // redux
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    osType,
    currentFileUid,
    fileTree,
    activePanel,
    cmdkOpen,
    cmdkPages,
    currentCmdkPage,
    cmdkSearchContent,
    htmlReferenceData,
    cmdkReferenceData,
    recentProject,
  } = useAppState();

  // hooks
  const {
    cmdkReferenceJumpstart,
    cmdkReferenceActions,
    cmdkReferenceRecentProject,
    cmdkReferenceAdd,
    cmdkReferenceRename,
  } = useCmdkReferenceData({
    htmlReferenceData,
  });

  const { importProject } = useHandlers();
  const { onClear, onJumpstart } = useCmdk({
    cmdkReferenceData,
    importProject,
  });

  const { validMenuItemCount, hoveredMenuItemDescription } = useCmdkModal();

  // open Jumpstart menu on startup
  useEffect(() => {
    Object.keys(cmdkReferenceJumpstart).length !== 0 && onJumpstart();
  }, [cmdkReferenceJumpstart]);

  const Groups = useMemo(
    () => ({
      Jumpstart: cmdkReferenceJumpstart,
      Actions: cmdkReferenceActions,
      Add: cmdkReferenceAdd,
      "Turn into": cmdkReferenceRename,
    }),
    [
      cmdkReferenceJumpstart,
      cmdkReferenceActions,
      cmdkReferenceAdd,
      cmdkReferenceRename,
    ],
  );

  const getCmdkReference = useCallback(
    (groupName: string) => ({
      Jumpstart:
        groupName !== "Recent"
          ? cmdkReferenceJumpstart[groupName]
          : cmdkReferenceRecentProject,
      Actions: cmdkReferenceActions[groupName],
      Add: cmdkReferenceAdd[groupName],
      "Turn into": cmdkReferenceRename[groupName],
    }),
    [
      cmdkReferenceJumpstart,
      cmdkReferenceRecentProject,
      cmdkReferenceActions,
      cmdkReferenceAdd,
      cmdkReferenceRename,
    ],
  );

  const isShowItem = useCallback(
    (command: TCmdkReference) => {
      const context: TCmdkContext = command.Context as TCmdkContext;
      const showPage = ["Jumpstart", "Add", "Turn into"];
      return (
        showPage.includes(currentCmdkPage) ||
        (currentCmdkPage === "Actions" &&
          (command.Name === "Add" ||
            command.Name === "Turn into" ||
            context.all === true ||
            (activePanel === "file" && context["file"]) ||
            ((activePanel === "node" || activePanel === "stage") &&
              (fileTree[currentFileUid]?.data as TFileNodeData)?.ext ===
                "html" &&
              context["html"])))
      );
    },
    [currentCmdkPage, activePanel, fileTree, currentFileUid],
  );

  const onCommandSelect = useCallback(
    async (command: TCmdkReference) => {
      LogAllow && console.log("onSelect", command);
      // keep modal open when toogling theme or go "Add" menu from "Actions" menu
      !COMMANDS_TO_KEEP_MODAL_OPEN.includes(command.Name) &&
        dispatch(setCmdkOpen(false));

      if (command.Group === "Add") {
        dispatch(
          setCurrentCommand({
            action: `${AddActionPrefix}-${command.Context}`,
          }),
        );
      } else if (command.Group === "Turn into") {
        dispatch(
          setCurrentCommand({
            action: `${RenameActionPrefix}-${command.Context}`,
          }),
        );
      } else if (
        currentCmdkPage === "Jumpstart" &&
        command.Group === "Recent"
      ) {
        const index = Number(command.Context);
        const projectContext = recentProject[index].context;
        const projectHandler = recentProject[index].handler;
        navigate("/");

        confirmFileChanges(fileTree) &&
          importProject(projectContext, projectHandler);
      } else {
        dispatch(setCurrentCommand({ action: command.Name }));
      }
    },
    [currentCmdkPage, recentProject, fileTree],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
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
    if (e.code === "Escape" || (e.code === "Backspace" && !cmdkSearchContent)) {
      if (e.code === "Escape" && cmdkPages.length === 1) {
        dispatch(setCmdkOpen(false));
      } else {
        cmdkPages.length !== 1 &&
          dispatch(setCmdkPages(cmdkPages.slice(0, -1)));
      }
    }
    e.stopPropagation();
  };
  return (
    <Command.Dialog
      open={cmdkOpen}
      className="background-primary radius-s shadow border"
      onOpenChange={(open: boolean) => dispatch(setCmdkOpen(open))}
      onKeyDown={onKeyDown}
      filter={(value: string, search: string) => {
        return value.includes(search) !== false ? 1 : 0;
      }}
      loop={true}
      label={currentCmdkPage}
    >
      {/* search input */}
      <div
        className={`gap-m box-l padding-m justify-start ${validMenuItemCount !== 0 && "border-bottom"}
            `}
      >
        <Command.Input
          value={cmdkSearchContent}
          onValueChange={(str: string) => dispatch(setCmdkSearchContent(str))}
          className="justify-start padding-s gap-s text-l background-primary"
          placeholder={
            PLACEHOLDERS[currentCmdkPage as keyof typeof PLACEHOLDERS] || ""
          }
        />
      </div>
      {/* modal content */}
      <div
        className={
          ["Add", "Jumpstart", "Turn into"].includes(currentCmdkPage)
            ? "box-l direction-column align-stretch box"
            : ""
        }
        style={{
          ...(["Add", "Jumpstart", "Turn into"].includes(currentCmdkPage) && {
            width: "100%",
          }),
          ...(validMenuItemCount === 0 && {
            height: "0px",
            overflow: "hidden",
          }),
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
              {Object.keys(
                Groups[currentCmdkPage as keyof typeof Groups] || {},
              ).map((groupName: string) => {
                let groupNameShow = false;
                (
                  getCmdkReference(groupName)[
                    currentCmdkPage as "Jumpstart" | "Actions" | "Add"
                  ] || []
                ).map((command: TCmdkReference) => {
                  groupNameShow = isShowItem(command);
                });

                return (
                  <Command.Group key={groupName} value={groupName}>
                    {/* group heading label */}
                    {groupNameShow && (
                      <div className="padding-m gap-s">
                        <span className="text-s opacity-m">{groupName}</span>
                      </div>
                    )}
                    {(
                      getCmdkReference(groupName)[
                        currentCmdkPage as "Jumpstart" | "Actions" | "Add"
                      ] || []
                    )?.map((command: TCmdkReference, index) => {
                      const show = isShowItem(command);
                      return (
                        show && (
                          <CommandItem
                            key={`${command.Name}-${command.Context}-${index}`}
                            command={command}
                            index={index}
                            onSelect={onCommandSelect}
                          />
                        )
                      );
                    })}
                  </Command.Group>
                );
              })}
            </Command.List>
          </div>
        </div>

        {/* description - right panel */}
        {(currentCmdkPage === "Add" || currentCmdkPage === "Jumpstart") &&
          false && (
            <div
              className={`box align-center border-left padding-l text-l ${hoveredMenuItemDescription ? "" : "opacity-m"}`}
            >
              {hoveredMenuItemDescription
                ? hoveredMenuItemDescription
                : "Description"}
            </div>
          )}
      </div>
    </Command.Dialog>
  );
};
