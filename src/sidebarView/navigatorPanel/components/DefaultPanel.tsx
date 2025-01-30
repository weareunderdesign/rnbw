import React, { useCallback, useMemo } from "react";
import { SVGIcon } from "@src/components";
import { RootNodeUid } from "@src/rnbwTSX";
import { useAppState } from "@_redux/useAppState";
import { setReloadIframe } from "@_redux/main/designView";

import { getFileExtension, getFileNameFromPath, isHomeIcon } from "../helpers";
import { useNavigatorPanelHandlers } from "../hooks";
import IconButton from "@src/components/IconButton/IconButton";
import { useDispatch } from "react-redux";
import { setCmdkPages } from "@src/_redux/main/cmdk";

export const DefaultPanel = () => {
  const dispatch = useDispatch();

  const { cmdkOpen, cmdkPages } = useAppState();

  const { project, fileTree, currentFileUid } = useAppState();

  const { filesReferenceData } = useAppState();

  const fileNode = useMemo(
    () => fileTree[currentFileUid],
    [fileTree, currentFileUid]
  );
  const fileName = useMemo(
    () => fileNode && getFileNameFromPath(fileNode),
    [fileNode]
  );
  const fileExtension = useMemo(
    () => fileNode && getFileExtension(fileNode),
    [fileNode]
  );

  const { onProjectClick, onFileClick } = useNavigatorPanelHandlers();

  const onJumpstart = useCallback(() => {
    if (cmdkOpen) return;
    dispatch(setCmdkPages(["Jumpstart"]));
  }, [cmdkOpen]);

  const onAdd = useCallback(() => {
    dispatch(setCmdkPages([...cmdkPages, "Add"]));
  }, [cmdkPages]);

  const simulateKeyboardEvent = (key: string) => {
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      code: `Key${key.toUpperCase()}`,
      charCode: key.charCodeAt(0),
    });
    document.dispatchEvent(event);
  };

  const handleReload = () => {
    dispatch(setReloadIframe(true));
  };

  return (
    <>
      <div className="gap-s align-center" onClick={onProjectClick}>
        <IconButton iconName="raincons/emoji" onClick={onJumpstart} />

        <span className="text-s opacity-m">/</span>

        <div
          onClick={(e) => {
            e.stopPropagation();
            console.log("folder icon clicked");
          }}
        >
          <SVGIcon name="folder" className="icon-xs" />
        </div>
        <span
          className="text-s"
          style={{
            maxWidth: "60px",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {project.name}
        </span>
        <span className="text-s opacity-m">/</span>
      </div>

      {fileNode && fileNode.parentUid !== RootNodeUid && (
        <>
          <span className="text-s">...</span>
          <span className="text-s opacity-m">/</span>
        </>
      )}

      {fileNode && (
        <div className="gap-s align-center" onClick={onFileClick}>
          <SVGIcon
            name={
              isHomeIcon(fileNode)
                ? "home"
                : filesReferenceData[fileExtension] && fileExtension !== "md"
                  ? filesReferenceData[fileExtension].Icon
                  : "page"
            }
            className="icon-xs"
          />

          <span
            className="text-s"
            style={{
              width: "60px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fileName}
          </span>

          {fileNode && fileNode.data.changed && (
            <div
              className="radius-s foreground-primary"
              title="unsaved file"
              style={{ width: "6px", height: "6px" }}
            />
          )}
        </div>
      )}

      <IconButton iconName="raincons/plus" onClick={onAdd} />
      <IconButton iconName="raincons/sync" onClick={handleReload} />
      <IconButton
        iconName="raincons/code-html"
        onClick={() => simulateKeyboardEvent("C")}
      />
    </>
  );
};
