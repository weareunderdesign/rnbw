import * as parse5 from "parse5";
import { RainbowAppName } from "@src/rnbwTSX";
import { RootNodeUid } from "@src/rnbwTSX";
import { TFileParserResponse, TNodeUid, TValidNodeUid } from "..";
import {
  THtmlDomNode,
  THtmlNode,
  THtmlNodeAttribs,
  THtmlNodeTreeData,
  THtmlParserResponse,
} from "../node/type/html";
import { addToast } from "@src/_redux/main/toasts";
import { useDispatch } from "react-redux";

export const StageNodeIdAttr = "data-rnbw-stage-node-id";
export const PreserveRnbwNode = "data-rnbw-preserve-node";
export const DataSequencedUid = "data-sequenced-uid";
export const ValidStageNodeUid = "data-rnbw-stage-valid-uid";


export const PARSING_ERROR_MESSAGES: Record<string, string> = {
  "unexpected-solidus-in-tag": "Unexpected symbol in tag",
  "missing-end-tag-name": "Missing end tag name",
  "end-tag-with-trailing-solidus": "end-tag-with-trailing-solidus",
  "missing-attribute-value": "Missing attribute value",
  "duplicate-attribute": "Duplicate attribute",
  "invalid-character-sequence-after-doctype-name":
    "Invalid character sequence after doctype name",
  "missing-doctype": "Missing doctype",
  "abrupt-closing-of-empty-comment": "Abrupt closing of empty comment",
};

export const parseHtml = (
  content: string,
  callback?: (validNodeUid: TValidNodeUid) => void,
): THtmlParserResponse => {
  // const { showToast } = useToast();
  const dispatch = useDispatch();

  const htmlDom = parse5.parse(content, {
    scriptingEnabled: true,
    sourceCodeLocationInfo: true,
    onParseError: (err) => {
      console.error(err);

      if (
        Object.prototype.hasOwnProperty.call(PARSING_ERROR_MESSAGES, err.code)
      ) {
          dispatch(addToast({
            title: 'Success',
            message: `${PARSING_ERROR_MESSAGES[err.code]}`,
            type: 'success',
          }));
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