import { RootNodeUid } from "@_constants/main";
import { TFileNode, TFileNodeData } from "@_node/file";
import { THtmlNodeData } from "@_node/node";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { TProject, TWorkspace } from "@_redux/main/fileTree";
import { focusNodeTreeNode, setSelectedNodeUids } from "@_redux/main/nodeTree";
import {
  ActionCreatorWithPayload,
  AnyAction,
  Dispatch,
} from "@reduxjs/toolkit";

export const isHomeIcon = (node: TNode) =>
  node.data.type == "html" &&
  node.data.name == "index" &&
  node.parentUid === "ROOT";

export const isSelected = (_project: TProject, project: TProject) => {
  return _project.context === project.context &&
    _project.name === project.name &&
    _project.handler === project.handler
    ? "selected"
    : "";
};

export const getFileNameFromPath = (file: TFileNode) => {
  return file.uid.split("/")[file.uid.split("/").length - 1];
};
export const getFileExtension = (node: TNode) =>
  (node.data as TFileNodeData).ext.substring(
    1,
    (node.data as TFileNodeData).ext.length,
  );

export const selectFirstNode = (
  validNodeTree: TNodeTreeData,
  selectNodeTreeNodes: ActionCreatorWithPayload<string[]>,
  expandNodeTreeNodes: ActionCreatorWithPayload<string[]>,
  dispatch: Dispatch<AnyAction>,
) => {
  let bodyId = "0";

  for (let x in validNodeTree) {
    if (
      validNodeTree[x].data.tagName === "body" &&
      validNodeTree[x].data.nodeName === "body"
    ) {
      bodyId = validNodeTree[x].uid;
      break;
    }
  }

  if (bodyId !== "0") {
    let firstNodeId = "0";
    for (let x in validNodeTree) {
      if (
        validNodeTree[x].data.tagName &&
        validNodeTree[x].parentUid === bodyId
      ) {
        firstNodeId = validNodeTree[x].uid;
        break;
      }
    }
    if (firstNodeId !== "0") {
      const _expandedItems: TNodeUid[] = [];
      let node = validNodeTree[firstNodeId];
      if (!node) {
        return;
      }
      while (node.uid !== RootNodeUid) {
        _expandedItems.push(node.uid);
        node = validNodeTree[node.parentUid as TNodeUid];
      }
      _expandedItems.shift();
      dispatch(expandNodeTreeNodes(_expandedItems));

      dispatch(setSelectedNodeUids([firstNodeId]));

      return false;
    }
  }
  return true;
};

export const setWorkspaceFavicon = (
  validNodeTree: TNodeTreeData,
  project: TProject,
  workspace: TWorkspace,
  setWorkspace: (ws: TWorkspace) => void,
) => {
  for (const x in validNodeTree) {
    const nodeData = validNodeTree[x].data as THtmlNodeData;
    if (
      nodeData &&
      nodeData.type === "tag" &&
      nodeData.name === "link" &&
      nodeData.attribs.rel === "icon"
    ) {
      const _projects: TProject[] = [];
      const pts = workspace.projects as TProject[];
      pts.map((_v) => {
        if (_v.name != "idb") {
          _projects.push({
            context: _v.context,
            name: _v.name,
            handler: _v.handler,
            favicon:
              _v.name === project.name
                ? window.location.origin +
                  "/rnbw/" +
                  project.name +
                  "/" +
                  nodeData.attribs.href
                : _v.favicon,
          });
        }
      });
      setWorkspace({ name: workspace.name, projects: _projects });
    }
  }
};
