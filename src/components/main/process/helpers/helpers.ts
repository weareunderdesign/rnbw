import { TCodeChange, TProject } from "@_types/main";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import { THtmlNodeData, THtmlPageSettings } from "@_node/html";
import {
  NodeInAppAttribName,
  RootNodeUid,
  NodeUidSplitter,
  StagePreviewPathPrefix,
} from "@_constants/main";
import { getSubNodeUidsByBfs, getValidNodeUids } from "@_node/apis";
import { TFileHandlerCollection, TFileNodeData, writeFile } from "@_node/file";

export const saveFileContent = async (
  project: TProject,
  ffHandlers: TFileHandlerCollection,
  uid: string,
  nodeData: TFileNodeData,
) => {
  if (project.context === "local") {
    const handler = ffHandlers[uid];
    const writableStream = await (
      handler as FileSystemFileHandle
    ).createWritable();
    await writableStream.write(nodeData.content);
    await writableStream.close();
    nodeData.changed = false;
    nodeData.orgContent = nodeData.content;
  } else if (project.context === "idb") {
    await writeFile(nodeData.path, nodeData.content);
    nodeData.changed = false;
    nodeData.orgContent = nodeData.content;
  }
};

export const removeOrgNode = (
  o_parentNode: TNode,
  codeChange: TCodeChange,
  tree: TNodeTreeData,
  _nodeTree: TNodeTreeData,
) => {
  o_parentNode.children = o_parentNode.children.reduce(
    (prev: any, cur: any) => {
      if (cur === codeChange.uid) {
        prev.push(tree[RootNodeUid].children[0]);
      } else {
        prev.push(cur);
      }
      return prev;
    },
    [] as TNodeUid[],
  );
  const o_uids = getSubNodeUidsByBfs(codeChange.uid, _nodeTree);
  o_uids.map((uid) => {
    delete _nodeTree[uid];
  });
};

export const addNewNode = (
  tree: TNodeTreeData,
  o_parentNode: TNode,
  _nodeTree: TNodeTreeData,
) => {
  const uids = getSubNodeUidsByBfs(RootNodeUid, tree, false);
  const nodeUids: TNodeUid[] = [];
  let _flag = false;
  let _newFocusedNodeUid = "";

  uids.map((uid) => {
    const node = tree[uid];
    if (node.parentUid === RootNodeUid) {
      !_flag && (_newFocusedNodeUid = uid);
      _flag = true;
      node.parentUid = o_parentNode.uid;
    }
    _nodeTree[uid] = JSON.parse(JSON.stringify(node));
    const nodeData = node.data as THtmlNodeData;
    nodeData.valid && nodeUids.push(uid);
  });

  return { nodeUids, _newFocusedNodeUid };
};

export const replaceElementInIframe = (
  o_node: TNode,
  formattedContent: string,
  nodeUids: string[],
  codeChange: TCodeChange,
  tree: TNodeTreeData,
) => {
  let nodeUidIndex = -1;
  const divElement = document.createElement("div");

  if (o_node.name !== "code" && o_node.name !== "pre") {
    divElement.innerHTML = formattedContent;
    const nodes: Node[] = [divElement.childNodes[0]];

    while (nodes.length) {
      const node = nodes.shift() as Node;
      if (node === undefined) continue;
      if (node.nodeName === "#text") {
        continue;
      }
      if ((node as HTMLElement).tagName) {
        (node as HTMLElement).setAttribute(
          NodeInAppAttribName,
          nodeUids[++nodeUidIndex],
        );
        node.childNodes.forEach((childNode) => {
          nodes.push(childNode);
        });
      }
    }
    // replace element to iframe
    const element = document
      .querySelector("iframe")
      ?.contentWindow?.window.document.querySelector(
        `[${NodeInAppAttribName}="${codeChange.uid}"]`,
      );
    element?.parentElement?.insertBefore(
      divElement.childNodes[0],
      element.nextSibling,
    );
    element?.remove();
  } else {
    let element = document
      .querySelector("iframe")
      ?.contentWindow?.window.document.querySelector(
        `[${NodeInAppAttribName}="${codeChange.uid}"]`,
      );

    if (element && tree["ROOT"].data) {
      element?.setAttribute(NodeInAppAttribName, tree["ROOT"].children[0]);
      element.outerHTML = (tree["ROOT"].data as THtmlNodeData).htmlInApp;
    }
  }
};
export const generateFileInfo = (
  _fileInfo: THtmlPageSettings,
  fileInfo: THtmlPageSettings,
) => {
  const _curScripts = _fileInfo.scripts;
  const _orgScripts = fileInfo.scripts;

  const curScripts: string[] = [];
  const curScriptObj: { [uid: TNodeUid]: boolean } = {};
  _curScripts.map((script: any) => {
    const attribs = (script.data as THtmlNodeData).attribs;
    const uniqueStr = Object.keys(attribs)
      .filter((attrName) => attrName !== NodeInAppAttribName)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((attrName) => {
        return `${attrName}${NodeUidSplitter}${attribs[attrName]}`;
      })
      .join(NodeUidSplitter);
    curScripts.push(uniqueStr);
    curScriptObj[uniqueStr] = true;
  });

  const orgScripts: string[] = [];
  const orgScriptObj: { [uid: string]: boolean } = {};
  _orgScripts.map((script: any) => {
    const attribs = (script.data as THtmlNodeData).attribs;
    const uniqueStr = Object.keys(attribs)
      .filter((attrName) => attrName !== NodeInAppAttribName)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((attrName) => {
        return `${attrName}${NodeUidSplitter}${attribs[attrName]}`;
      })
      .join(NodeUidSplitter);
    orgScripts.push(uniqueStr);
    orgScriptObj[uniqueStr] = true;
  });
  return { curScripts, orgScripts, orgScriptObj };
};

export const getHtmlPageSettings = (
  _nodeTree: TNodeTreeData,
  _fileInfo: THtmlPageSettings,
) => {
  Object.keys(_nodeTree).map((uid) => {
    const node = _nodeTree[uid];
    const nodeData = node.data as THtmlNodeData;
    if (nodeData.type === "tag") {
      if (nodeData.name === "title") {
        _fileInfo ? (_fileInfo.title = node.uid) : null;
      } else if (
        nodeData.name === "link" &&
        nodeData.attribs.rel === "icon" &&
        nodeData.attribs.href
      ) {
        _fileInfo && _fileInfo.favicon.push(nodeData.attribs.href);
      }
    } else if (nodeData.type === "script") {
      _fileInfo && _fileInfo.scripts.push(node);
    }
  });
};

export const getChangedUids = (
  nodeTree: TNodeTreeData,
  _nodeTree: TNodeTreeData,
  o_uids: string[],
) => {
  const deletedUids: TNodeUid[] = [];
  const _uidsToChange: TNodeUid[] = [];
  const n_uids = getSubNodeUidsByBfs(RootNodeUid, _nodeTree);

  o_uids.map((o_uid: any, index: any) => {
    const o_node = nodeTree[o_uid];
    const o_nodeData = o_node.data as THtmlNodeData;
    const n_uid = n_uids[index];
    const n_node = _nodeTree[n_uid];
    const n_nodeData = n_node?.data as THtmlNodeData;
    if (o_uid !== n_uid && (o_nodeData.valid || n_nodeData?.valid)) {
      deletedUids.push(o_uid);
      o_node.name !== "!doctype" &&
        _uidsToChange.push(
          (o_nodeData.valid ? o_node.parentUid : n_node.parentUid) as TNodeUid,
        );
    }
  });

  _uidsToChange.reverse();
  const uidsToChange = getValidNodeUids(
    nodeTree,
    _uidsToChange
      .filter((uid) => nodeTree[uid])
      .reduce((prev, cur) => {
        if (!prev.length || prev[prev.length - 1] !== cur) {
          prev.push(cur);
        }
        return prev;
      }, [] as TNodeUid[]),
  );

  // iframe
  uidsToChange.map((uid) => {
    const n_node = _nodeTree[uid];
    const n_nodeData = n_node.data as THtmlNodeData;
    // replace html in iframe
    const element = document
      .querySelector("iframe")
      ?.contentWindow?.window.document.querySelector(
        `[${NodeInAppAttribName}="${uid}"]`,
      );
    if (element?.tagName === "HTML") {
      element.innerHTML = n_nodeData.htmlInApp;
    } else {
      element ? (element.outerHTML = n_nodeData.htmlInApp) : null;
    }
  });
};
export const refreshIframeIfSeedNodeChanges = (
  nodeTree: TNodeTreeData,
  _nodeTree: TNodeTreeData,
  _needToReloadIFrame: boolean,
) => {
  const o_uids = getSubNodeUidsByBfs(RootNodeUid, nodeTree);
  for (const o_uid of o_uids) {
    const o_node = nodeTree[o_uid];
    const n_node = _nodeTree[o_uid];
    if (!n_node) {
      if (
        o_node.name === "html" ||
        o_node.name === "head" ||
        o_node.name === "body"
      ) {
        _needToReloadIFrame = true;
        break;
      }
    }
  }
  return o_uids;
};
export const getPreViewPath = (
  ffTree: TNodeTreeData,
  _file: TNode,
  fileData: TFileNodeData,
) => {
  const p_fileData = ffTree[_file.parentUid as TNodeUid].data as TFileNodeData;
  const previewPath = `${p_fileData.path}/${StagePreviewPathPrefix}${fileData.name}${fileData.ext}`;
  return previewPath;
};

export const detectSeedNodeChanges = (
  _nodeTree: TNodeTreeData,
  codeChanges: TCodeChange[],
) => {
  let seedNodeChanged = false;
  for (const change of codeChanges) {
    const { uid } = change;
    const node = _nodeTree[uid];
    if (node === undefined) continue;
    if (
      uid === RootNodeUid ||
      node.name === "html" ||
      node.name === "head" ||
      node.name === "body"
    ) {
      seedNodeChanged = true;
    }
  }
  return seedNodeChanged;
};
