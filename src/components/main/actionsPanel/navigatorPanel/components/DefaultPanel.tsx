import React, { useContext, useMemo } from "react";
import { useSelector } from "react-redux";

import { SVGIconI } from "@_components/common";
import { TFileNodeData } from "@_node/file";
import { MainContext, navigatorSelector } from "@_redux/main";

import { useNavigatorPanelHandlers } from "../hooks";

export const DefaultPanel = React.memo(() => {
  const { file } = useSelector(navigatorSelector);
  const { project, ffTree, filesReferenceData } = useContext(MainContext);

  const node = useMemo(() => ffTree[file.uid], [ffTree, file.uid]);

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
            {node.data.type == "html" &&
            node.data.name == "index" &&
            node.parentUid === "ROOT"
              ? "home"
              : filesReferenceData[
                  (node.data as TFileNodeData).ext.substring(
                    1,
                    (node.data as TFileNodeData).ext.length,
                  )
                ] &&
                (node.data as TFileNodeData).ext.substring(
                  1,
                  (node.data as TFileNodeData).ext.length,
                ) !== "md"
              ? filesReferenceData[
                  (node.data as TFileNodeData).ext.substring(
                    1,
                    (node.data as TFileNodeData).ext.length,
                  )
                ].Icon
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
            {file.uid.split("/")[file.uid.split("/").length - 1]}
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
