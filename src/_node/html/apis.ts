import * as htmlparser2 from "htmlparser2";
import { Document } from "domhandler";
import * as domutils from "domutils";
import { NodeInAppAttribName, RootNodeUid } from "@_constants/main";
// @ts-ignore
import { getLineBreaker } from "@_services/global";
import { TOsType } from "@_types/global";

import {
  getNodeChildIndex,
  getNodeDepth,
  getSubNodeUidsByBfs,
  getSubNodeUidsByDfs,
  THtmlNodeData,
  TNode,
  TNodeTreeData,
  TNodeUid,
} from "../";
import { THtmlDomNodeData, THtmlParserResponse } from "./types";
import { editor } from "monaco-editor";
import { getPositionFromIndex } from "@_services/htmlapi";

const noNeedClosingTag = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];
const emptyImage = window.location.origin + "/images/empty-image.svg";
export const setHtmlNodeInAppAttribName = (node: TNode, newUid: TNodeUid) => {
  const nodeData = node.data as THtmlNodeData;
  nodeData.attribs[NodeInAppAttribName] = newUid;
};
export const addFormatTextBeforeNode = (
  tree: TNodeTreeData,
  node: TNode,
  uid: TNodeUid,
  osType: TOsType,
  tabSize: number,
): void => {
  const parentNode = tree[node.parentUid as TNodeUid];
  const position = getNodeChildIndex(parentNode, node);
  const parentNodeDepth = getNodeDepth(tree, parentNode.uid);

  // generate text node
  const formatTextNode: TNode = {
    uid,
    parentUid: parentNode.uid,
    name: "text",
    isEntity: true,
    children: [],
    data: {
      valid: false,
      isFormatText: true,

      type: "text",
      name: "",
      data: getLineBreaker(osType) + " ".repeat(parentNodeDepth * tabSize),
      attribs: { [NodeInAppAttribName]: uid },

      html: "",
      htmlInApp: "",

      startLineNumber: 0,
      startColumn: 0,
      endLineNumber: 0,
      endColumn: 0,
    } as THtmlNodeData,
  };

  // add text node
  tree[uid] = formatTextNode;

  // update parent
  if (position === 0) {
    parentNode.children.splice(0, 0, uid);
  } else {
    const prevNode = tree[parentNode.children[position - 1]];
    const prevNodeData = prevNode.data as THtmlNodeData;
    if (!prevNodeData.isFormatText) {
      parentNode.children.splice(position, 0, uid);
    } else {
      delete tree[prevNode.uid];
      parentNode.children.splice(position - 1, 1, uid);
    }
  }
};
export const addFormatTextAfterNode = (
  tree: TNodeTreeData,
  node: TNode,
  uid: TNodeUid,
  osType: TOsType,
  tabSize: number,
): void => {
  const parentNode = tree[node.parentUid as TNodeUid];
  const position = getNodeChildIndex(parentNode, node);
  const parentNodeDepth = getNodeDepth(tree, parentNode.uid);

  // generate text node
  const formatTextNode: TNode = {
    uid,
    parentUid: parentNode.uid,
    name: "text",
    isEntity: true,
    children: [],
    data: {
      valid: false,
      isFormatText: true,

      type: "text",
      name: "",
      data:
        getLineBreaker(osType) +
        " ".repeat(
          (position === parentNode.children.length - 1
            ? parentNodeDepth - 1
            : parentNodeDepth) * tabSize,
        ),
      attribs: { [NodeInAppAttribName]: uid },

      html: "",
      htmlInApp: "",

      startLineNumber: 0,
      startColumn: 0,
      endLineNumber: 0,
      endColumn: 0,
    } as THtmlNodeData,
  };

  // add text node
  tree[uid] = formatTextNode;

  // update parent
  if (position === parentNode.children.length - 1) {
    parentNode.children.push(uid);
  } else {
    const nextNode = tree[parentNode.children[position + 1]];
    const nextNodeData = nextNode.data as THtmlNodeData;
    if (!nextNodeData.isFormatText) {
      parentNode.children.splice(position + 1, 0, uid);
    } else {
      delete tree[nextNode.uid];
      parentNode.children.splice(position + 1, 1, uid);
    }
  }
};
export const indentNode = (
  tree: TNodeTreeData,
  node: TNode,
  indentSize: number,
  osType: TOsType,
) => {
  const subNodeUids = getSubNodeUidsByBfs(node.uid, tree);
  subNodeUids.map((subNodeUid) => {
    const subNode = tree[subNodeUid];
    const nodeData = subNode.data as THtmlNodeData;
    if (nodeData.isFormatText) {
      const text = nodeData.data;
      const textParts = text.split(getLineBreaker(osType));
      const singleLine = textParts.length === 1;
      const lastPart = textParts.pop();
      const newLastPart = " ".repeat(lastPart?.length || 0 + indentSize);
      nodeData.data =
        textParts.join(getLineBreaker(osType)) +
        (singleLine ? "" : getLineBreaker(osType)) +
        newLastPart;
    }
  });
};
let htmlContent = "";
let htmlContentInApp = "";

export const parseHtml = (
  content: string,
  keepNodeUids: null | boolean = false,
  nodeMaxUid: TNodeUid = "",
  monacoEditor: editor.IStandaloneCodeEditor,
): THtmlParserResponse => {
  let _nodeMaxUid = keepNodeUids === false ? 0 : Number(nodeMaxUid);
  // parse the html content
  let dom = htmlparser2.parseDocument(content, {
    withEndIndices: true,
    withStartIndices: true,
  });

  let appDom: Document;
  htmlContent = content;
  // parse the html content
  const tmpTree: TNodeTreeData = {};
  function preprocessNodes(dom: Document) {
    appDom = dom;

    // build root node
    tmpTree[RootNodeUid] = {
      uid: RootNodeUid,
      parentUid: null,
      name: RootNodeUid,
      isEntity: false,
      children: [],
      data: { valid: true },
    };

    // build depth-1 seed nodes
    const seedNodes: TNode[] = [];
    appDom.children.forEach((node) => {
      const uid = String(++_nodeMaxUid) as TNodeUid;

      tmpTree[RootNodeUid].children.push(uid);
      tmpTree[uid] = {
        uid,
        parentUid: RootNodeUid,
        name: "",
        isEntity: true,
        children: [],
        data: { ...node, valid: node.type === "tag" },
      };

      seedNodes.push(tmpTree[uid]);
    });

    // build the whole node tree from the seed nodes - BFS
    while (seedNodes.length) {
      const node = seedNodes.shift() as TNode;
      const nodeData = node.data as THtmlDomNodeData;

      if (!nodeData.children) continue;

      nodeData.children.map((child: THtmlDomNodeData) => {
        const uid = String(++_nodeMaxUid) as TNodeUid;

        //set html file title as the app title
        if (child.name === "title") {
          let titleText = child?.children?.[0]?.data ?? "rnbw";
          window.document.title = titleText;
        }

        node.children.push(uid);
        node.isEntity = false;

        tmpTree[uid] = {
          uid,
          parentUid: node.uid,
          name: "",
          isEntity: true,
          children: [],
          data: { ...child, valid: child.type === "tag" },
        };

        //add attribute to node
        if (!child.attribs) child.attribs = {};
        child.attribs[NodeInAppAttribName] = uid;

        seedNodes.push(tmpTree[uid]);
      });
    }
    htmlContentInApp = domutils.getOuterHTML(appDom);
  }

  preprocessNodes(dom);

  const tree: TNodeTreeData = {};
  let uids: TNodeUid[] = Object.keys(tmpTree);
  uids.map((uid) => {
    const node = tmpTree[uid];

    // build valid node tree
    if (uid === RootNodeUid) {
      tree[uid] = { ...node };
    } else {
      const nodeData = node.data as THtmlDomNodeData;

      let isFormatText = false,
        valid = true;
      if (!nodeData.valid) {
        // format text node
        valid = false;
        isFormatText = true;
      } else {
        // detect general text node
        valid = nodeData.type !== "text";
      }

      // set in-app-attribute to nodes
      if (!nodeData.attribs) nodeData.attribs = {};
      nodeData.attribs[NodeInAppAttribName] = uid;
      let data = "";
      if (nodeData.children) {
        nodeData.children.forEach((child: THtmlDomNodeData) => {
          if (child.type === "text") {
            data += child.data;
          }
        });
      }
      tree[uid] = {
        ...node,
        name: nodeData.name || nodeData.type,
        data: {
          valid,
          isFormatText,
          type: nodeData.type,
          name: nodeData.name,
          data: data,
          attribs: nodeData.attribs,
          startIndex: nodeData.startIndex,
          endIndex: nodeData.endIndex,
          positions: getPositionFromIndex(
            monacoEditor,
            nodeData.startIndex,
            nodeData.endIndex,
          ),
        },
      };
    }
  });

  // set html, htmlInApp, code range to nodes
  const formattedContent = content;
  const contentInApp = htmlContentInApp;

  return {
    formattedContent,
    contentInApp,
    tree,
    nodeMaxUid: String(_nodeMaxUid) as TNodeUid,
    htmlDom: dom,
  };
};

export const serializeHtml = (tree: TNodeTreeData): THtmlNodeData => {
  // build html, htmlInApp
  let uids = getSubNodeUidsByBfs(RootNodeUid, tree);
  uids.reverse();
  uids.map((uid) => {
    const node = tree[uid];
    const nodeData = node.data as THtmlNodeData;
    // set html
    nodeData.html = "";
  });
  uids = getSubNodeUidsByDfs(RootNodeUid, tree);

  return tree[RootNodeUid].data as THtmlNodeData;
};

export const parseHtmlCodePart = (
  content: string,
  nodeMaxUid: TNodeUid = "",
  start: number = 0,
  monacoEditor: editor.IStandaloneCodeEditor,
): THtmlParserResponse => {
  let _nodeMaxUid = Number(nodeMaxUid);

  // parse html
  const tmpTree: TNodeTreeData = {};
  const tree: TNodeTreeData = {};

  let dom = htmlparser2.parseDocument(content, {
    withEndIndices: true,
    withStartIndices: true,
  });

  let appDom: Document;
  function preprocessNodes(dom: Document) {
    appDom = dom;

    // build root node
    tmpTree[RootNodeUid] = {
      uid: RootNodeUid,
      parentUid: null,
      name: RootNodeUid,
      isEntity: false,
      children: [],
      data: { valid: true },
    };

    // build depth-1 seed nodes
    const seedNodes: TNode[] = [];
    appDom.children.forEach((node) => {
      const uid = String(++_nodeMaxUid) as TNodeUid;

      tmpTree[RootNodeUid].children.push(uid);
      tmpTree[uid] = {
        uid,
        parentUid: RootNodeUid,
        name: "",
        isEntity: true,
        children: [],
        data: { ...node, valid: node.type === "tag" },
      };

      seedNodes.push(tmpTree[uid]);
    });

    // build the whole node tree from the seed nodes - BFS
    while (seedNodes.length) {
      const node = seedNodes.shift() as TNode;
      const nodeData = node.data as THtmlDomNodeData;

      if (!nodeData.children) continue;

      nodeData.children.map((child: THtmlDomNodeData) => {
        const uid = String(++_nodeMaxUid) as TNodeUid;

        node.children.push(uid);
        node.isEntity = false;

        tmpTree[uid] = {
          uid,
          parentUid: node.uid,
          name: "",
          isEntity: true,
          children: [],
          data: { ...child, valid: child.type === "tag" },
        };

        //add attribute to node
        if (!child.attribs) child.attribs = {};
        child.attribs[NodeInAppAttribName] = uid;

        seedNodes.push(tmpTree[uid]);
      });
    }
    htmlContentInApp = domutils.getOuterHTML(appDom);
  }

  preprocessNodes(dom);

  let uids: TNodeUid[] = Object.keys(tmpTree);
  uids.map((uid) => {
    const node = tmpTree[uid];

    // build valid node tree
    if (uid === RootNodeUid) {
      tree[uid] = { ...node };
    } else {
      const nodeData = node.data as THtmlDomNodeData;

      let isFormatText = false,
        valid = true;
      if (!nodeData.valid) {
        // format text node
        valid = false;
        isFormatText = true;
      } else {
        // detect general text node
        valid = nodeData.type !== "text";
      }

      // set in-app-attribute to nodes
      if (!nodeData.attribs) nodeData.attribs = {};
      nodeData.attribs[NodeInAppAttribName] = uid;

      tree[uid] = {
        ...node,
        name: nodeData.name || nodeData.type,
        data: {
          valid,
          isFormatText,
          type: nodeData.type,
          name: nodeData.name,
          data: nodeData.data,
          attribs: nodeData.attribs,
          startIndex: start + nodeData.startIndex,
          endIndex: start + nodeData.endIndex,
          positions: getPositionFromIndex(
            monacoEditor,
            start + nodeData.startIndex,
            start + nodeData.endIndex,
          ),
        },
      };
    }
  });

  return {
    formattedContent: content,
    contentInApp: "",
    tree,
    nodeMaxUid: String(_nodeMaxUid) as TNodeUid,
  };
};

export const checkValidHtml = (content: string): boolean => {
  // remove code & pre & script tag's content
  const tmpString = content
    .replace(/<pre\b[^<]*(?:(?!<\/pre>)<[^<]*)*<\/pre>/gi, "<pre></pre>")
    .replace(/<code\b[^<]*(?:(?!<\/code>)<[^<]*)*<\/code>/gi, "<code></code>")
    .replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "<script></script>",
    )
    .replace(
      /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
      "<style></style>",
    );
  let hasMismatchedTags = false;
  let openingTags = [];
  let closingTags = [];
  let regex = /<\/?[a-zA-Z0-9]+\b[^>]*>/g; // Matches any HTML tag
  let match = regex.exec(tmpString);
  while (match) {
    let tag = match[0];
    if (tag.startsWith("</")) {
      let _tag = tag.slice(2, -1).split(" ")[0].replace("\n", "");
      if (noNeedClosingTag.find((_item) => _tag === _item) === undefined) {
        closingTags.push(_tag);
      }
    } else {
      let _tag = tag.slice(1, -1).split(" ")[0].replace("\n", "");
      if (noNeedClosingTag.find((_item) => _tag === _item) === undefined) {
        openingTags.push(_tag);
      }
    }
    match = regex.exec(tmpString);
  }
  if (openingTags.length !== closingTags.length) {
    hasMismatchedTags = true; // Different number of opening and closing tags
  } else {
    openingTags.sort();
    closingTags.sort();
    for (let i = 0; i < openingTags.length; i++) {
      if (openingTags[i] !== closingTags[i]) hasMismatchedTags = true;
    }
  }

  return hasMismatchedTags;
};
