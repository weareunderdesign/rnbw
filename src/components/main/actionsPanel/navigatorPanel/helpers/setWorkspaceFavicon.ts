import { THtmlNodeData } from "@_node/html";
import { TProject, TWorkspace } from "@_types/main";
import { TNodeTreeData } from "@_node/types";

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
