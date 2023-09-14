import React, { useContext, useMemo } from "react";
import { useSelector } from "react-redux";

import { SVGIconI } from "@_components/common";
import { TFileNodeData } from "@_node/file";
import { MainContext, navigatorSelector } from "@_redux/main";

import { useNavigatorPanelHandlers } from "../hooks";
import { isHomeIcon, getFileNameFromPath, getFileExtension } from "../helpers";

export const DefaultPanel = React.memo(() => {
  const { file } = useSelector(navigatorSelector);
  const { project, ffTree, filesReferenceData } = useContext(MainContext);

  const node = useMemo(() => ffTree[file.uid], [ffTree, file.uid]);
  const fileName = useMemo(() => getFileNameFromPath(file), [file]);
  const fileExtension = useMemo(() => getFileExtension(node), [node]);

  const { onProjectClick, onFileClick } = useNavigatorPanelHandlers();

  return (
    <>
      <div className="gap-s align-center" onClick={onProjectClick}>
        <SVGIconI {...{ class: "icon-xs" }}>folder</SVGIconI>

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
      </div>

      <span className="text-s opacity-m">/</span>

      {/* path */}
      {file.parentUid !== "ROOT" && (
        <>
          <span className="text-s">...</span>
          <span className="text-s opacity-m">/</span>
        </>
      )}

      {/* file */}
      {node && (
        <div className="gap-s align-center" onClick={onFileClick}>
          <SVGIconI {...{ class: "icon-xs" }}>
            {isHomeIcon(node)
              ? "home"
              : filesReferenceData[fileExtension] && fileExtension !== "md"
              ? filesReferenceData[fileExtension].Icon
              : "page"}
          </SVGIconI>
          <span
            className="text-s"
            style={{
              width: file.parentUid !== "ROOT" ? "60px" : "90px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {fileName}
          </span>

          {node && (node.data as TFileNodeData).changed && (
            <div
              className="radius-s foreground-primary"
              title="unsaved file"
              style={{ width: "6px", height: "6px" }}
            />
          )}
        </div>
      )}
    </>
  );
});
