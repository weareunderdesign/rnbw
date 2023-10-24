import { RootNodeUid } from "@_constants/main";
import { TOsType } from "@_types/global";

import {
  addFormatTextAfterNode,
  addFormatTextBeforeNode,
  indentNode,
  setHtmlNodeInAppAttribName,
  THtmlNodeData,
  THtmlReferenceData,
} from "./html";
import {
  TNode,
  TNodeApiResponse,
  TNodeReferenceData,
  TNodeTreeContext,
  TNodeTreeData,
  TNodeUid,
  TNormalNodeData,
} from "./types";
import { TFile } from "@_types/main";
import { TFileNodeData } from "./file";

export const getSubNodeUidsByBfs = (
  uid: TNodeUid,
  tree: TNodeTreeData,
  withItSelf: boolean = true,
): TNodeUid[] => {
  const subUids: TNodeUid[] = [];

  const uids = [uid];
  while (uids.length) {
    const subUid = uids.shift() as TNodeUid;
    const subNode = tree[subUid];
    if (subNode) {
      subUids.push(subUid);
      uids.push(...subNode.children);
    }
  }

  !withItSelf && subUids.shift();

  return subUids;
};
export const getSubNodeUidsByDfs = (
  uid: TNodeUid,
  tree: TNodeTreeData,
  withItSelf: boolean = true,
): TNodeUid[] => {
  const subUids: TNodeUid[] = [];

  const uids = [uid];
  while (uids.length) {
    const subUid = uids.shift() as TNodeUid;
    const subNode = tree[subUid];
    subUids.push(subUid);
    uids.splice(0, 0, ...subNode.children);
  }

  !withItSelf && subUids.shift();

  return subUids;
};
export const getPrevSiblingNodeUid = (
  tree: TNodeTreeData,
  node: TNode,
): TNodeUid => {
  let beforeUid = "" as TNodeUid;

  const parentNode = tree[node.parentUid as TNodeUid];
  for (const uid of parentNode.children) {
    if (uid === node.uid) break;
    beforeUid = uid;
  }

  return beforeUid;
};
export const getValidPrevNodeUid = (
  tree: TNodeTreeData,
  node: TNode,
): TNodeUid => {
  let prevNodeUid = "" as TNodeUid;

  const parentNode = tree[node.parentUid as TNodeUid];
  for (const uid of parentNode.children) {
    if (uid === node.uid) break;

    const childNode = tree[uid];
    const childNodeData = childNode.data as TNormalNodeData;
    if (!childNodeData.valid) continue;

    prevNodeUid = uid;
  }

  return prevNodeUid === "" ? parentNode.uid : prevNodeUid;
};
export const getNodeChildIndex = (parentNode: TNode, node: TNode): number => {
  let childIndex = 0;
  if (parentNode === undefined) return childIndex;

  for (const uid of parentNode.children) {
    if (uid === node.uid) break;
    ++childIndex;
  }

  return childIndex;
};
export const getNodeDepth = (tree: TNodeTreeData, uid: TNodeUid): number => {
  let nodeDepth = 0,
    node = tree[uid];

  while (node.uid !== RootNodeUid) {
    node = tree[node.parentUid as TNodeUid];
    ++nodeDepth;
  }

  return nodeDepth;
};
export const getNodeDepthExternal = (
  tree: TNodeTreeData,
  uid: TNodeUid,
): number => {
  let nodeDepth = 0,
    node = tree[uid];

  while (node.uid !== RootNodeUid) {
    node = tree[node.parentUid as TNodeUid];
    ++nodeDepth;
  }

  return nodeDepth;
};
export const getValidNodeUids = (
  tree: TNodeTreeData,
  uids: TNodeUid[],
  targetUid?: TNodeUid,
  treeType?: TNodeTreeContext,
  referenceData?: TNodeReferenceData,
): TNodeUid[] => {
  let validatedUids: { [uid: TNodeUid]: boolean } = {};

  // validate collection
  uids.map((uid) => {
    // remove parent uids
    let parentNode = tree[uid];
    while (parentNode.uid !== RootNodeUid) {
      parentNode = tree[parentNode.parentUid as TNodeUid];
      delete validatedUids[parentNode.uid];
    }

    // remove nested uids
    Object.keys(validatedUids).map((validatedUid) => {
      let validatedNode = tree[validatedUid];
      while (validatedNode.uid !== RootNodeUid) {
        validatedNode = tree[validatedNode.parentUid as TNodeUid];
        if (validatedNode.uid === uid) {
          delete validatedUids[validatedUid];
          break;
        }
      }
    });

    // add current uid
    validatedUids[uid] = true;
  });

  // validate target
  if (targetUid) {
    let targetNode = tree[targetUid];
    while (targetNode.uid !== RootNodeUid) {
      delete validatedUids[targetNode.uid];
      targetNode = tree[targetNode.parentUid as TNodeUid];
    }

    if (treeType === "html") {
      const { elements } = referenceData as THtmlReferenceData;

      const targetNode = tree[targetUid];
      const targetNodeData = targetNode.data as THtmlNodeData;
      const targetRefData = elements[targetNodeData.name];

      if (targetRefData) {
        if (targetRefData.Contain === "All") {
          // do nothing
        } else if (targetRefData.Contain === "None") {
          validatedUids = {};
        } else {
          const containTagObj: { [uid: TNodeUid]: boolean } = {};
          const tagList = targetRefData.Contain.replace(/ /g, "").split(",");
          tagList.map((tag: string) => {
            const pureTag = tag.slice(1, tag.length - 1);
            containTagObj[pureTag] = true;
          });

          Object.keys(validatedUids).map((uid) => {
            const node = tree[uid];
            const nodeData = node.data as THtmlNodeData;
            if (!containTagObj[nodeData.name]) {
              delete validatedUids[uid];
            }
          });
        }
      }
    }
  }

  return uids.filter((uid) => validatedUids[uid]);
};

export const addNode = (
  tree: TNodeTreeData,
  targetUid: TNodeUid,
  node: TNode,
  contentNode: TNode | null,
  treeType: TNodeTreeContext,
  nodeMaxUid: TNodeUid,
  osType: TOsType,
  tabSize: number,
): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid);

  // update parent
  const targetNode = tree[targetUid];
  const parentNode = tree[targetNode.parentUid as TNodeUid];
  const position = getNodeChildIndex(parentNode, targetNode) + 1;
  parentNode.children.splice(position, 0, node.uid);
  parentNode.isEntity = false;

  // add node
  tree[node.uid] = node;
  if (contentNode) {
    tree[contentNode.uid] = contentNode;
  }
  if (treeType === "html") {
    // format node
    addFormatTextBeforeNode(
      tree,
      node,
      String(++_nodeMaxUid) as TNodeUid,
      osType,
      tabSize,
    );
  } else {
    // do nothing
  }

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid };
};
export const removeNode = (
  tree: TNodeTreeData,
  uids: TNodeUid[],
  treeType: TNodeTreeContext,
  fileData: TFileNodeData,
  file: TFile,
): TNodeApiResponse => {
  let validPrevNodeUid = "" as TNodeUid;
  const deletedUids: TNodeUid[] = [];
  let prevStartIndex = 0;
  uids.map((uid) => {
    const node = tree[uid];
    const parentNode = tree[node.parentUid as TNodeUid];

    if (treeType === "html") {
      // store last element when delete nodes
      validPrevNodeUid = getValidPrevNodeUid(tree, node);

      // remove prev format text node
      const prevNodeUid = getPrevSiblingNodeUid(tree, node);
      if (prevNodeUid !== "") {
        const prevNode = tree[prevNodeUid];
        if ((prevNode.data as THtmlNodeData).isFormatText) {
          prevStartIndex =
            prevNode.sourceCodeLocation.endOffset -
            prevNode.sourceCodeLocation.startOffset;
          delete tree[prevNodeUid];
          parentNode.children = parentNode.children.filter(
            (childUid) => childUid !== prevNodeUid,
          );
        }
      }
    } else {
      // do nothing
    }

    // update parent
    parentNode.children = parentNode.children.filter((c_uid) => c_uid !== uid);
    parentNode.isEntity = parentNode.children.length === 0;

    // remove nest nodes
    const subUids = getSubNodeUidsByBfs(uid, tree);

    fileData.content = replaceContentByFormatted(
      file.content,
      tree[uid].sourceCodeLocation.startOffset - prevStartIndex - 1,
      tree[uid].sourceCodeLocation.endOffset,
      "",
    );

    updateExistingTree(
      tree,
      tree[uid].sourceCodeLocation.startOffset - prevStartIndex - 1,
      tree[uid].sourceCodeLocation.endOffset,
      "",
    );

    subUids.map((subUid) => {
      delete tree[subUid];
    });

    deletedUids.push(...subUids);
  });

  return { tree, deletedUids, lastNodeUid: validPrevNodeUid };
};
export const copyNode = (
  tree: TNodeTreeData,
  targetUid: TNodeUid,
  isBetween: boolean,
  position: number,
  uids: TNodeUid[],
  treeType: TNodeTreeContext,
  nodeMaxUid: TNodeUid,
  osType: TOsType,
  tabSize: number,
): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid);

  const targetNode = tree[targetUid];
  const targetNodeDepth = getNodeDepth(tree, targetUid);

  const addedUidMap = new Map<TNodeUid, TNodeUid>();

  const _uids = [...uids];
  _uids.reverse();
  _uids.map((uid) => {
    const node = tree[uid];
    const orgSubNodeUids = getSubNodeUidsByBfs(uid, tree);
    // copy root node
    const newUid = String(++_nodeMaxUid) as TNodeUid;

    const newNode = structuredClone(node) as TNode;
    const parentNodeDepth = getNodeDepth(tree, newNode.parentUid as TNodeUid);

    newNode.uid = newUid;
    newNode.parentUid = targetUid;

    if (treeType === "html") {
      setHtmlNodeInAppAttribName(newNode, newUid);
    } else {
      // do nothing
    }

    // add root node
    if (isBetween) {
      let inserted = false,
        index = -1;

      targetNode.children = targetNode.children.reduce((prev, cur) => {
        tree[cur].data.valid && index++;
        if (index === position && !inserted) {
          inserted = true;
          prev.push(newUid);
        }

        prev.push(cur);
        return prev;
      }, [] as TNodeUid[]);

      !inserted && targetNode.children.push(newUid);
    } else {
      targetNode.children.push(newUid);
    }

    // copy sub nodes
    const subNodes = [newNode];
    let index = -1;
    while (subNodes.length) {
      const subNode = subNodes.shift() as TNode;

      addedUidMap.set(orgSubNodeUids[++index], subNode.uid);

      subNode.children = subNode.children.map((childUid) => {
        const newChildUid = String(++_nodeMaxUid) as string;

        const childNode = structuredClone(tree[childUid]) as TNode;

        childNode.uid = newChildUid;
        childNode.parentUid = subNode.uid;

        if (treeType === "html") {
          setHtmlNodeInAppAttribName(childNode, newChildUid);
        } else {
          // do nothing
        }

        subNodes.push(childNode);

        return newChildUid;
      });
      tree[subNode.uid] = subNode;
    }

    // format node
    if (treeType === "html") {
      addFormatTextBeforeNode(
        tree,
        newNode,
        String(++_nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
      );
      addFormatTextAfterNode(
        tree,
        newNode,
        String(++_nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
      );
      targetNodeDepth !== parentNodeDepth &&
        indentNode(
          tree,
          newNode,
          (targetNodeDepth - parentNodeDepth) * tabSize,
          osType,
        );
    }
  });
  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid, addedUidMap };
};

export const copyNodeExternal = (
  tree: TNodeTreeData,
  targetUid: TNodeUid,
  isBetween: boolean,
  position: number,
  nodes: TNode[],
  treeType: TNodeTreeContext,
  nodeMaxUid: TNodeUid,
  osType: TOsType,
  tabSize: number,
  prevTree: TNodeTreeData,
): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid);

  const targetNode = tree[targetUid];
  const targetNodeDepth = getNodeDepth(tree, targetUid);

  const addedUidMap = new Map<TNodeUid, TNodeUid>();

  const _nodes = [...nodes];
  _nodes.reverse();
  _nodes.map((_node) => {
    const node = prevTree[_node.uid] as TNode;
    const orgSubNodeUids = getSubNodeUidsByBfs(node.uid, prevTree);

    // copy root node
    const newUid = String(++_nodeMaxUid) as TNodeUid;

    const newNode = structuredClone(node) as TNode;

    newNode.uid = newUid;
    newNode.parentUid = targetUid;

    if (treeType === "html") {
      setHtmlNodeInAppAttribName(newNode, newUid);
    } else {
      // do nothing
    }

    // add root node
    if (isBetween) {
      let inserted = false,
        index = -1;

      targetNode.children = targetNode.children.reduce((prev, cur) => {
        tree[cur].data.valid && index++;
        if (index === position && !inserted) {
          inserted = true;
          prev.push(newUid);
        }

        prev.push(cur);
        return prev;
      }, [] as TNodeUid[]);

      !inserted && targetNode.children.push(newUid);
    } else {
      targetNode.children.push(newUid);
    }

    // copy sub nodes
    const subNodes = [newNode];
    let index = -1;
    while (subNodes.length) {
      let subNode = subNodes.shift() as TNode;

      addedUidMap.set(orgSubNodeUids[++index], subNode.uid);

      subNode.children = subNode.children.map((childUid) => {
        const newChildUid = String(++_nodeMaxUid) as string;

        const childNode = structuredClone(prevTree[childUid]) as TNode;

        childNode.uid = newChildUid;
        childNode.parentUid = subNode.uid;
        if (treeType === "html") {
          setHtmlNodeInAppAttribName(childNode, newChildUid);
        } else {
          // do nothing
        }
        subNodes.push(childNode);

        return newChildUid;
      });
      tree[subNode.uid] = subNode;
    }
    // format node
    if (treeType === "html") {
      addFormatTextBeforeNode(
        tree,
        newNode,
        String(++_nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
      );
      addFormatTextAfterNode(
        tree,
        newNode,
        String(++_nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
      );
      const parentNodeDepth = getNodeDepthExternal(
        tree,
        newNode.parentUid as TNodeUid,
      );
      targetNodeDepth !== parentNodeDepth &&
        indentNode(
          tree,
          newNode,
          (targetNodeDepth - parentNodeDepth) * tabSize,
          osType,
        );
    }
  });

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid, addedUidMap };
};

export const moveNode = (
  tree: TNodeTreeData,
  targetUid: TNodeUid,
  isBetween: boolean,
  position: number,
  uids: TNodeUid[],
  treeType: TNodeTreeContext,
  nodeMaxUid: TNodeUid,
  osType: TOsType,
  tabSize: number,
): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid);

  const targetNode = tree[targetUid];
  const targetNodeDepth = getNodeDepth(tree, targetUid);

  // remove from org parents
  let uidOffset = 0;
  const _uids = [...uids];
  _uids.reverse();
  _uids.map((uid) => {
    const node = tree[uid];
    const parentNode = tree[node.parentUid as TNodeUid];

    // get valid position
    if (parentNode.uid === targetUid) {
      let validChildIndex = 0;
      for (const childUid of parentNode.children) {
        if (childUid === uid) break;
        tree[childUid].data.valid && ++validChildIndex;
      }
      validChildIndex < position && ++uidOffset;
    }

    if (treeType === "html") {
      // remove prev format text node
      const prevNodeUid = getPrevSiblingNodeUid(tree, node);
      if (prevNodeUid !== "") {
        const prevNode = tree[prevNodeUid];
        if ((prevNode.data as THtmlNodeData).isFormatText) {
          delete tree[prevNodeUid];
          parentNode.children = parentNode.children.filter(
            (childUid) => childUid !== prevNodeUid,
          );
        }
      }
    } else {
      // do nothing
    }

    // update parent
    parentNode.children = parentNode.children.filter(
      (childUid) => childUid !== uid,
    );
    parentNode.isEntity = parentNode.children.length === 0;
  });

  // add to new target + position
  const _position = position - uidOffset;
  _uids.map((uid) => {
    const node = tree[uid];
    const parentNodeDepth = getNodeDepth(tree, node.parentUid as TNodeUid);

    // add to target
    node.parentUid = targetUid;
    targetNode.isEntity = false;

    if (isBetween) {
      let inserted = false,
        index = -1;

      targetNode.children = targetNode.children.reduce((prev, cur) => {
        tree[cur].data.valid && ++index;
        if (index === _position && !inserted) {
          inserted = true;
          prev.push(uid);
        }

        prev.push(cur);
        return prev;
      }, [] as TNodeUid[]);

      !inserted && targetNode.children.push(uid);
    } else {
      targetNode.children.push(uid);
    }

    // format node
    if (treeType === "html") {
      addFormatTextBeforeNode(
        tree,
        node,
        String(++_nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
      );
      addFormatTextAfterNode(
        tree,
        node,
        String(++_nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
      );

      targetNodeDepth !== parentNodeDepth &&
        indentNode(
          tree,
          node,
          (targetNodeDepth - parentNodeDepth) * tabSize,
          osType,
        );
    }
  });

  return {
    tree,
    nodeMaxUid: String(_nodeMaxUid) as TNodeUid,
    position: _position,
  };
};

export const duplicateNode = (
  tree: TNodeTreeData,
  uids: TNodeUid[],
  treeType: TNodeTreeContext,
  nodeMaxUid: TNodeUid,
  osType: TOsType,
  tabSize: number,
): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid);

  const addedUidMap = new Map<TNodeUid, TNodeUid>();

  uids.map((uid) => {
    const node = tree[uid];
    const parentNode = tree[node.parentUid as TNodeUid];
    const orgSubNodeUids = getSubNodeUidsByBfs(uid, tree);

    // duplicate root node
    const newUid = String(++_nodeMaxUid) as TNodeUid;
    const newNode = structuredClone(tree[uid]) as TNode;
    newNode.uid = newUid;

    if (treeType === "html") {
      setHtmlNodeInAppAttribName(newNode, newUid);
    } else {
      // do nothing
    }

    // update parent
    const position = getNodeChildIndex(parentNode, node) + 1;
    parentNode.children.splice(position, 0, newUid);

    // duplicate sub nodes
    const subNodes = [newNode];
    let index = -1;
    while (subNodes.length) {
      const subNode = subNodes.shift() as TNode;

      addedUidMap.set(orgSubNodeUids[++index], subNode.uid);

      subNode.children = subNode.children.map((childUid) => {
        const newChildUid = String(++_nodeMaxUid) as string;

        const childNode = structuredClone(tree[childUid]) as TNode;

        childNode.uid = newChildUid;
        childNode.parentUid = subNode.uid;

        if (treeType === "html") {
          setHtmlNodeInAppAttribName(childNode, newChildUid);
        } else {
          // do nothing
        }

        subNodes.push(childNode);

        return newChildUid;
      });

      tree[subNode.uid] = subNode;
    }

    // format node
    if (treeType === "html") {
      addFormatTextBeforeNode(
        tree,
        newNode,
        String(++_nodeMaxUid) as TNodeUid,
        osType,
        tabSize,
      );
    }
  });

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid, addedUidMap };
};

export const updateExistingTree = (
  _nodeTree: TNodeTreeData,
  start: number,
  end: number,
  formattedContent: string,
) => {
  const diff = formattedContent.length - (end - start) - 1;

  for (const key in _nodeTree) {
    if (_nodeTree[key].sourceCodeLocation.startOffset > start) {
      _nodeTree[key].sourceCodeLocation.startOffset += diff;
    }

    if (_nodeTree[key].sourceCodeLocation.endOffset > end) {
      _nodeTree[key].sourceCodeLocation.endOffset += diff;
    }
  }
};

export function replaceContentByFormatted(
  inputString: string,
  startIndex: number,
  endIndex: number,
  replacement: string,
) {
  if (
    typeof inputString !== "string" ||
    startIndex < 0 ||
    endIndex < 0 ||
    startIndex >= inputString.length ||
    endIndex >= inputString.length
  ) {
    // Check if inputString is a string and indices are valid
    return inputString;
  }

  const prefix = inputString.slice(0, startIndex + 1);
  const suffix = inputString.slice(endIndex + 1);

  const replacedString = prefix + replacement + suffix;

  return replacedString;
}
