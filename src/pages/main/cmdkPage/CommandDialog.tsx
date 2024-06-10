import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useCmdkModal, useCmdkReferenceData, useHandlers } from "../hooks";
import { CommandItem } from "./CommandItem";
import { CommandDialogProps, TCmdkPage } from "./types";
import {
  SINGLE_CMDK_PAGE,
  DEEP_CMDK_PAGE,
  COMMANDS_TO_KEEP_MODAL_OPEN,
  PLACEHOLDERS,
} from "./constants";
import { SVGIcon, SVGIconIV } from "@_components/common";

const iconMappping = {
  New: "/images/jumpstart/new.svg",
  Open: "/images/jumpstart/open.svg",
  Guide: "/images/jumpstart/guide.svg",
  Support: "/images/jumpstart/support.svg",
  Community: "/images/jumpstart/community.svg",
  Theme: "/images/jumpstart/theme.svg",
  Autosave: "/images/jumpstart/autosave.svg",
  "Code Wrap": "/images/jumpstart/formatcode.svg",
  Recent: "/images/jumpstart/open.svg",
  files: "/images/jumpstart/page.svg",
};
export const CommandDialog = ({ onClear, onJumpstart }: CommandDialogProps) => {
  const [currentFocusedMenuItem, setCurrentFocusedMenuItem] = useState({
    name: "New",
    description: "Start a new project",
  });

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
    recentProject,
  } = useAppState();

  // hooks
  const cmdkReference = useCmdkReferenceData({ htmlReferenceData });
  const { importProject } = useHandlers();
  const { validMenuItemCount, hoveredMenuItemDescription } = useCmdkModal();
  const isRecent = useCallback(
    (groupName: string) => {
      return currentCmdkPage === "Jumpstart" && groupName === "Recent";
    },
    [currentCmdkPage],
  );
  // open Jumpstart menu on startup
  useEffect(() => {
    Object.keys(cmdkReference.Jumpstart).length !== 0 && onJumpstart();
  }, [cmdkReference.Jumpstart]);

  // Get command reference
  const getCmdkReference = useCallback(
    (groupName: string) => {
      if (isRecent(groupName)) return cmdkReference.Recent;

      const group = cmdkReference[currentCmdkPage as TCmdkPage];
      return group?.[groupName] || [];
    },
    [cmdkReference, currentCmdkPage],
  );
  // determines if need to show a group name or command option
  const isShowItem = useCallback(
    (command: TCmdkReference) => {
      const context: TCmdkContext = command.Context as TCmdkContext;
      const isSingleCmdkPage = SINGLE_CMDK_PAGE.includes(currentCmdkPage);

      const isDeepCmdkPage = DEEP_CMDK_PAGE.includes(currentCmdkPage);
      const isAllContext = context?.all === true;
      const isFileContext = activePanel === "file" && context?.file;
      const isHtmlContext =
        (activePanel === "node" || activePanel === "stage") &&
        (fileTree[currentFileUid]?.data as TFileNodeData)?.ext === "html" &&
        context?.html;

      return (
        isSingleCmdkPage ||
        (currentCmdkPage === "Actions" &&
          (isDeepCmdkPage || isAllContext || isFileContext || isHtmlContext))
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
      dispatch(setCmdkSearchContent(""));

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
      } else if (command.Group === "Files") {
        const filePath = command?.Path;
        if (filePath) navigate(filePath);
      } else if (isRecent(command.Group)) {
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

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
          dispatch(setCmdkOpen(false));
        } else if (cmdkPages.length !== 1) {
          dispatch(setCmdkPages(cmdkPages.slice(0, -1)));
        }
      }
      e.stopPropagation();
    },
    [osType, cmdkSearchContent, cmdkPages],
  );

  const isPageOpenedFromActions = useMemo(
    () =>
      DEEP_CMDK_PAGE.includes(currentCmdkPage) && cmdkPages[0] === "Actions",
    [currentCmdkPage, cmdkPages],
  );
  const onBackIconClick = () => {
    dispatch(setCmdkPages(["Actions"]));
    dispatch(setCmdkSearchContent(""));
  };

  return (
    <Command.Dialog
      open={cmdkOpen}
      className="border shadow background-primary radius-s"
      onOpenChange={(open: boolean) => dispatch(setCmdkOpen(open))}
      onKeyDown={onKeyDown}
      filter={(value: string, search: string) => {
        return value.includes(search?.toLowerCase()) !== false ? 1 : 0;
      }}
      loop={true}
      label={currentCmdkPage}
    >
      {/* search input */}
      <div
        className={`gap-m box-l padding-m justify-start align-center ${validMenuItemCount !== 0 && "border-bottom"}
            `}
      >
        {isPageOpenedFromActions && (
          <div className="padding-s action-button" onClick={onBackIconClick}>
            <SVGIcon {...{ class: "icon-xs" }}>raincons/arrow-left</SVGIcon>
          </div>
        )}
        <Command.Input
          value={cmdkSearchContent}
          onValueChange={(str: string) => dispatch(setCmdkSearchContent(str))}
          className="justify-start padding-s gap-s text-l background-primary"
          placeholder={PLACEHOLDERS[currentCmdkPage as TCmdkPage] || ""}
        />
      </div>

      {/* modal content */}
      <div
        className={
          SINGLE_CMDK_PAGE.includes(currentCmdkPage)
            ? "box-l direction-column align-stretch box"
            : ""
        }
        style={{
          ...(SINGLE_CMDK_PAGE.includes(currentCmdkPage) && {
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
              {/* showing options by groups */}
              {Object.keys(
                cmdkReference[currentCmdkPage as TCmdkPage] || {},
              ).map((groupName: string) => {
                let groupNameShow = false;
                getCmdkReference(groupName)?.map((command: TCmdkReference) => {
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
                    {/* show command option */}
                    {getCmdkReference(groupName)?.map(
                      (command: TCmdkReference, index) =>
                        isShowItem(command) && (
                          <CommandItem
                            key={`${command.Name}-${command.Context}-${index}`}
                            command={command}
                            index={index}
                            onSelect={onCommandSelect}
                            onMouseEnter={() => {
                              let itemName = command.Name || "";
                              if (groupName === "Recent") {
                                itemName = "Recent";
                              } else if (groupName === "Files") {
                                itemName = "files";
                              }
                              setCurrentFocusedMenuItem({
                                name: itemName,
                                description: command.Description || "",
                              });
                            }}
                          />
                        ),
                    )}
                  </Command.Group>
                );
              })}
            </Command.List>
          </div>
        </div>

        <div
          className="padding-m align-center border-left"
          style={{ width: "200%" }}
        >
          {Object.keys(iconMappping).map((key, index) => (
            <div
              id={`label${index + 1}`}
              className={
                currentFocusedMenuItem.name === key
                  ? "column justify-center align-center"
                  : "hidden"
              }
              key={index}
            >
              <SVGIconIV
                src={`${iconMappping?.[key as keyof typeof iconMappping]}`}
                style={{ height: "160px", width: "160px" }}
              />

              <div className="text-l padding-s">
                {currentFocusedMenuItem.name}
              </div>
              <div className="text-m">{currentFocusedMenuItem.description}</div>
            </div>
          ))}
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
