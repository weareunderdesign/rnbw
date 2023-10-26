import { TCodeChange, TFile, TFileInfo, TProject } from "@_types/main";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import {
  THtmlNodeData,
  THtmlPageSettings,
  parseHtmlCodePart,
  serializeHtml,
} from "@_node/html";
import {
  NodeInAppAttribName,
  RootNodeUid,
  NodeUidSplitter,
  StagePreviewPathPrefix,
  LogAllow,
} from "@_constants/main";
import {
  getSubNodeUidsByBfs,
  getValidNodeUids,
  replaceContentByFormatted,
  updateExistingTree,
} from "@_node/apis";
import {
  TFileHandlerCollection,
  TFileNodeData,
  parseFile,
  serializeFile,
  writeFile,
} from "@_node/file";
import { TUpdateOptions } from "@_redux/main/types";
import { TOsType } from "@_types/global";
import { editor } from "monaco-editor";

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
  _newFocusedNodeUid: string,
) => {
  const uids = getSubNodeUidsByBfs(RootNodeUid, tree, false);
  const nodeUids: TNodeUid[] = [];
  let _flag = false;

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
export const getFileData = (
  _file: TNode,
  updateOpt: TUpdateOptions,
  nodeTree: TNodeTreeData,
) => {
  const fileData = _file.data as TFileNodeData;

  if (updateOpt.from === "node") {
    const serializedRes = serializeFile(fileData.type, nodeTree);

    if (fileData.type === "html") {
      const { html, htmlInApp } = serializedRes as THtmlNodeData;

      // update ffTree
      fileData.content = html;
      fileData.contentInApp = htmlInApp;
      fileData.changed = fileData.content !== fileData.orgContent;
    }
  }
  return fileData;
};

export const handleFileUpdate = (
  fileData: TFileNodeData,
  _nodeTree: TNodeTreeData,
  _nodeMaxUid: number,
  file: TFile,
  monacoEditor: editor.IStandaloneCodeEditor,
) => {
  const {
    formattedContent,
    contentInApp,
    tree,
    nodeMaxUid: newNodeMaxUid,
  } = parseFile({ type: fileData.type, content: file.content });

  fileData.content = formattedContent;
  fileData.contentInApp = contentInApp;
  fileData.changed = fileData.content !== fileData.orgContent;
  return { tree, newNodeMaxUid };
};

export const handleHtmlUpdate = (
  fileData: TFileNodeData,
  file: TFile,
  _nodeTree: TNodeTreeData,
  _nodeMaxUid: number,
  codeChanges: TCodeChange[],
  updateOpt: TUpdateOptions,
  monacoEditor: editor.IStandaloneCodeEditor,
) => {
  let fileContent = file.content;
  if (updateOpt.from === "stage") {
    for (const change of codeChanges) {
      const { uid, content } = change;
      const node = _nodeTree[uid];
      const nodeData = node.data as THtmlNodeData;
      nodeData.html = content;
    }
    // rebuild from new tree
    const { html: formattedContent } = serializeHtml(_nodeTree);
    fileContent = formattedContent;
  }
  const {
    contentInApp,
    tree,
    nodeMaxUid: newNodeMaxUid,
  } = parseFile({
    type: fileData.type,
    content: fileContent,
    nodeMaxUid: String(_nodeMaxUid) as TNodeUid,
  });

  fileData.content = fileContent;
  fileData.contentInApp = contentInApp;
  fileData.changed = fileData.content !== fileData.orgContent;

  return { tree, newNodeMaxUid };
};
export const handleHmsChange = (
  fileData: TFileNodeData,
  state: { file: TFile; focusedItem: string },
  context: {
    ffTree: TNodeTreeData;
    nodeTree: TNodeTreeData;
    osType: TOsType;
    currentFileUid: string;
  },
  updateData: {
    _nodeTree: TNodeTreeData;
    _nodeMaxUid: number;
    _needToReloadIFrame: boolean;
    _newFocusedNodeUid: string;
    onlyRenderViewState: boolean;
    tempFocusedItem: string;
  },
  monacoEditor: editor.IStandaloneCodeEditor,
) => {
  const { file, focusedItem } = state;
  const { ffTree, nodeTree, osType, currentFileUid } = context;
  let {
    _nodeTree,
    _nodeMaxUid,
    _needToReloadIFrame,
    _newFocusedNodeUid,
    onlyRenderViewState,
    tempFocusedItem,
  } = updateData;
  const _currentFile = ffTree[currentFileUid];
  const _currentFileData = _currentFile.data as TFileNodeData;

  if (
    file.uid === currentFileUid &&
    file.content === _currentFileData.contentInApp
  ) {
    LogAllow && console.log("view state changed by hms");
    // no need to build new node tree
    onlyRenderViewState = true;
  } else {
    LogAllow && console.log("file content changed by hms");
    // parse hms content keeping node uids
    const {
      formattedContent,
      contentInApp,
      tree,
      nodeMaxUid: newNodeMaxUid,
    } = parseFile({
      type: fileData.type,
      content: file.content,
      keepNodeUids: true,
      nodeMaxUid: String(_nodeMaxUid) as TNodeUid,
    });
    _nodeTree = tree;
    _nodeMaxUid = Number(newNodeMaxUid);
    fileData.content = formattedContent;
    fileData.contentInApp = contentInApp;
    fileData.changed = fileData.content !== fileData.orgContent;
    while (!_nodeTree[tempFocusedItem]) {
      if (_nodeTree[tempFocusedItem] == undefined) break;
      tempFocusedItem = _nodeTree[tempFocusedItem].parentUid as TNodeUid;
    }
    if (file.uid !== currentFileUid) {
      _needToReloadIFrame = true;
    } else {
      // refresh iframe if it has seed node changes
      const o_uids = refreshIframeIfSeedNodeChanges(
        nodeTree,
        _nodeTree,
        _needToReloadIFrame,
      );
      // --------------------------- iframe side effects ---------------------------
      if (!_needToReloadIFrame) {
        getChangedUids(nodeTree, _nodeTree, o_uids);
      }
    }
  }
  if (tempFocusedItem !== focusedItem) {
    _newFocusedNodeUid = tempFocusedItem;
  } else {
    _newFocusedNodeUid = focusedItem;
  }

  return {
    onlyRenderViewState,
    _newFocusedNodeUid,
    _nodeTree,
    _nodeMaxUid,
  };
};

export const updateFileInfoFromNodeTree = (
  _fileInfo: TFileInfo,
  fileInfo: TFileInfo,
  _nodeTree: TNodeTreeData,
  _needToReloadIFrame: boolean,
) => {
  _fileInfo = {
    title: "",
    scripts: [],
    favicon: [],
  } as THtmlPageSettings;
  getHtmlPageSettings(_nodeTree, _fileInfo);

  // compare new file info with org file info
  if (!_needToReloadIFrame && fileInfo) {
    const { curScripts, orgScripts, orgScriptObj } = generateFileInfo(
      _fileInfo,
      fileInfo,
    );
    if (curScripts.length !== orgScripts.length) {
      _needToReloadIFrame = true;
    } else {
      for (const script of curScripts) {
        if (!orgScriptObj[script]) {
          _needToReloadIFrame = true;
          break;
        }
      }
    }
  }
  return { _needToReloadIFrame };
};
export function removeAttributeFromElement(
  htmlString: string,
  attributeName: string,
) {
  const pattern = new RegExp(`\\s*${attributeName}=["'][^"']*["']\\s*`, "g");
  return htmlString.replace(pattern, "");
}

export const editingTextChanges = (
  codeChange: TCodeChange,
  fileData: TFileNodeData,
  file: TFile,
  _nodeTree: TNodeTreeData,
  _nodeMaxUid: number,
  _newFocusedNodeUid: string,
) => {
  // ---------------------- node tree side effect ----------------------
  // parse code part

  let originalNode = _nodeTree[codeChange.uid]; //original node (the node which was previously focused)

  const start = originalNode.sourceCodeLocation.startOffset;
  const end = originalNode.sourceCodeLocation.endOffset;

  const formattedContent = removeAttributeFromElement(
    codeChange.content,
    NodeInAppAttribName,
  );

  if (formattedContent == "") {
    return { _nodeMaxUid, _newFocusedNodeUid };
  }
  const { tree, nodeMaxUid } = parseHtmlCodePart(
    formattedContent,
    String(_nodeMaxUid) as TNodeUid,
    start,
  );
  _nodeMaxUid = Number(nodeMaxUid);

  updateExistingTree(_nodeTree, start, end, formattedContent);

  if (originalNode === undefined) return { _nodeMaxUid, _newFocusedNodeUid };
  const originalParentNode = _nodeTree[originalNode.parentUid as TNodeUid];

  removeOrgNode(originalParentNode, codeChange, tree, _nodeTree);

  let { nodeUids, _newFocusedNodeUid: newFocusedNode } = addNewNode(
    tree,
    originalParentNode,
    _nodeTree,
    _newFocusedNodeUid,
  );

  _newFocusedNodeUid = newFocusedNode;

  // ---------------------- iframe side effect ----------------------
  // build element to replace

  replaceElementInIframe(
    originalNode,
    formattedContent,
    nodeUids,
    codeChange,
    tree,
  );

  fileData.content = replaceContentByFormatted(
    file.content,
    start,
    end,
    formattedContent,
  );

  return { _nodeMaxUid, _newFocusedNodeUid };
};
