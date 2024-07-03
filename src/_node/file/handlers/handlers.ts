import * as parse5 from "parse5";

import { RainbowAppName } from "@src/indexConstants";
import { RootNodeUid } from "@src/indexConstants";

import { TFileParserResponse, TNodeUid, TValidNodeUid } from "../../";
import {
  THtmlDomNode,
  THtmlNode,
  THtmlNodeAttribs,
  THtmlNodeTreeData,
  THtmlParserResponse,
} from "../../node/type/html";
import {
  DataSequencedUid,
  StageNodeIdAttr,
  PARSING_ERROR_MESSAGES,
  ValidStageNodeUid,
} from "./constants";
import { toast } from "react-toastify";

export const parseHtml = (
  content: string,
  callback?: (validNodeUid: TValidNodeUid) => void,
): THtmlParserResponse => {
  const htmlDom = parse5.parse(content, {
    scriptingEnabled: true,
    sourceCodeLocationInfo: true,
    onParseError: (err) => {
      console.error(err);

      if (
        Object.prototype.hasOwnProperty.call(PARSING_ERROR_MESSAGES, err.code)
      ) {
        toast(PARSING_ERROR_MESSAGES[err.code], {
          type: "warning",
          toastId: PARSING_ERROR_MESSAGES[err.code],
        });
      }
    },
  });

  const nodeTree: THtmlNodeTreeData = {};
  (() => {
    nodeTree[RootNodeUid] = {
      uid: RootNodeUid,
      validUid: RootNodeUid,
      parentUid: null,

      displayName: RootNodeUid,

      isEntity: true,
      children: [],

      data: {
        childNodes: htmlDom.childNodes,

        valid: true,

        nodeName: "",
        tagName: "",
        textContent: "",

        attribs: {},

        sourceCodeLocation: {
          startLine: 0,
          startCol: 0,
          startOffset: 0,
          endLine: 0,
          endCol: 0,
          endOffset: 0,
        },
      },
      uniqueNodePath: RootNodeUid,
    };
    const seedNodes: THtmlNode[] = [nodeTree[RootNodeUid]];
    let _uid = 0;
    let _validUid = 0;

    const getHtmlNodeAttribs = (
      uid: TNodeUid,
      attrs: { name: string; value: string }[],
    ): THtmlNodeAttribs => {
      const attribs: THtmlNodeAttribs = {
        [DataSequencedUid]: uid,
      };
      attrs.map((attr) => {
        attribs[attr.name] = attr.value;
      });
      return attribs;
    };

    const isValidNode = (node: THtmlDomNode) => {
      return node.nodeName == "#documentType" || node.nodeName == "#text"
        ? !!node?.value?.replace(/[\n\s]/g, "").length
        : true;
    };

    const getUniqueNodePath = ({
      parentUid,
      node,
      nodeTree,
      index,
    }: {
      parentUid: TNodeUid;
      node: THtmlDomNode;
      nodeTree: THtmlNodeTreeData;
      index: number;
    }) => {
      const parent = nodeTree[parentUid];
      const parentPath = parent.uniqueNodePath;
      if (parentPath) {
        return `${parentPath}_${node.nodeName}${index}`;
      }
      return `${node.nodeName}${index}`;
    };
    const proceedWithNode = ({
      uid,
      validUid,
      parentUid,
      node,
      nodeTree,
      index,
    }: {
      uid: TNodeUid;
      validUid: TValidNodeUid;
      parentUid: TNodeUid;
      node: THtmlDomNode;
      nodeTree: THtmlNodeTreeData;
      index: number;
    }) => {
      const {
        startLine = 0,
        startCol = 0,
        startOffset = 0,
        endLine = 0,
        endCol = 0,
        endOffset = 0,
        startTag,
        endTag,
      } = node.sourceCodeLocation || {};

      nodeTree[parentUid].children.push(uid);
      nodeTree[parentUid].isEntity = false;
      const _isValidNode = isValidNode(node);
      const uniqueNodePath = _isValidNode
        ? getUniqueNodePath({ parentUid, node, nodeTree, index })
        : "";

      nodeTree[uid] = {
        uid,
        validUid: _isValidNode ? validUid : null,
        parentUid: parentUid,

        displayName: node.nodeName,

        isEntity: true,
        children: [],
        uniqueNodePath,
        data: {
          childNodes: node.childNodes,
          valid: _isValidNode,

          nodeName: node.nodeName,
          tagName: node.tagName || "",
          textContent: node.value || "",

          attribs: getHtmlNodeAttribs(uid, node.attrs || []),

          sourceCodeLocation: {
            startLine,
            startCol,
            startOffset,
            endLine,
            endCol,
            endOffset,
            startTag,
            endTag,
          },
        },
      };
      if (!node.attrs) node.attrs = [];
      node.attrs.push({ name: StageNodeIdAttr, value: uid });
      _isValidNode &&
        validUid &&
        node.attrs.push({ name: ValidStageNodeUid, value: `${validUid}` });
      node.attrs.push({
        name: DataSequencedUid,
        value: nodeTree[uid].uniqueNodePath,
      });
    };

    while (seedNodes.length) {
      const node = seedNodes.shift() as THtmlNode;
      if (!node.data.childNodes) continue;

      node.data.childNodes.map((child: THtmlDomNode, index: number) => {
        const uid = String(++_uid);

        const validUid = isValidNode(child) ? ++_validUid : null;
        validUid && callback && callback(validUid);

        if (child.nodeName === "title") {
          window.document.title =
            child?.childNodes?.[0]?.value ?? RainbowAppName;
        }

        proceedWithNode({
          validUid,
          uid,
          parentUid: node.uid,
          node: child,
          nodeTree,
          index,
        });
        seedNodes.push(nodeTree[uid]);
      });
    }
  })();

  const uids = Object.keys(nodeTree);
  uids.map((uid) => {
    const node = nodeTree[uid];
    delete node.data.childNodes;
  });

  const contentInApp = parse5.serialize(htmlDom);

  return {
    contentInApp,
    nodeTree,
    htmlDom,
    selectedNodeUids: [],
  };
};

export const fileHandlers: {
  [ext: string]: (
    content: string,
    callback?: (validNodeUid: TValidNodeUid) => void,
  ) => TFileParserResponse;
} = {
  html: parseHtml,
};
