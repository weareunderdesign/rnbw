import * as prettier from "prettier/standalone";
import * as htmlParser from "prettier/plugins/html";
import * as parse5 from "parse5";
import { Range, editor } from "monaco-editor";
import { useAppState } from "@_redux/useAppState";
import { useContext, useMemo } from "react";
import { MainContext } from "@_redux/main";
import { getObjKeys } from "@_pages/main/helper";
import { LogAllow, RainbowAppName } from "@_constants/global";
import { html_beautify } from "js-beautify";
import {
  sortUidsByMaxEndIndex,
  sortUidsByMinStartIndex,
} from "@_components/main/actionsPanel/nodeTreeView/helpers";
import { toast } from "react-toastify";
import {
  THtmlDomNode,
  THtmlNode,
  THtmlNodeAttribs,
  THtmlNodeTreeData,
  THtmlParserResponse,
} from "@_node/node";
import {
  DataSequencedUid,
  PARSING_ERROR_MESSAGES,
  StageNodeIdAttr,
  TNodeUid,
  TValidNodeUid,
  ValidStageNodeUid,
} from "@_node/index";
import { RootNodeUid } from "@_constants/main";
import { useDispatch } from "react-redux";
import {
  focusNodeTreeNode,
  selectNodeTreeNodes,
  setNeedToSelectNodePaths,
  setSelectedNodeUids,
} from "@_redux/main/nodeTree";

export async function PrettyCode(code: string, startCol: number = 0) {
  try {
    let prettyCode = await prettier.format(code, {
      parser: "html",
      plugins: [htmlParser],
    });

    /*  When prettier receives the code, it formats it as independent code (as a separate file),
      and it does not take into account that you need to keep some initial tabs or spaces
      to make this code look formatted relative to the other code.
         
      The following code checks if the code starts with tabs/spaces and includes
      them in each line to make it consistent with the rest of the code.
      This code also checks for blank lines and removes them. 
      
      startCol - the position from which the line with the code begins. */

    if (startCol > 1) {
      const lines = prettyCode.split("\n");
      const nonEmptyLines = lines.filter((line) => !/^\s*$/.test(line));
      const spaces = " ".repeat(startCol - 1);

      const linesWithSpaces = nonEmptyLines.map((line, index) => {
        return index === 0 ? line : spaces + line;
      });

      prettyCode = linesWithSpaces.join("\n");
    }
    return prettyCode;
  } catch (e) {
    console.error(e);
    //@ts-expect-error - toast.error expects a string
    const msg = e?.message as string;
    if (msg) {
      toast.error(`Failed to format the code: ${msg.split(".")[0]}`);
    }
    return code;
  }
}
export const useElementHelper = () => {
  const { nSelectedItemsObj, validNodeTree, needToSelectNodePaths } =
    useAppState();
  const { monacoEditorRef } = useContext(MainContext);
  const dispatch = useDispatch();
  const selectedItems = useMemo(
    () => getObjKeys(nSelectedItemsObj),
    [nSelectedItemsObj],
  );
  function getEditorModelWithCurrentCode() {
    /*The role of helperModel is to perform all the edit operations in it 
  without affecting the actual codeViewInstanceModel and then apply the changes 
  to the codeViewInstanceModel all at once.*/
    const codeViewInstanceModel = monacoEditorRef.current?.getModel();
    const helperModel = editor.createModel("", "html");
    codeViewInstanceModel &&
      helperModel.setValue(codeViewInstanceModel.getValue());
    return helperModel;
  }
  function checkAllResourcesAvailable() {
    const codeViewInstanceModel = monacoEditorRef.current?.getModel();
    if (selectedItems.length === 0) return false;
    if (!codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstanceModel ? "" : "Model"} is undefined`,
        );
      return false;
    }
    return true;
  }

  async function copyAndCutNode({
    selectedUids,
    pasteToClipboard = true,
    sortDsc = false,
  }: {
    selectedUids?: string[];
    pasteToClipboard?: boolean;
    sortDsc?: boolean;
  } = {}) {
    const codeViewInstanceModel = monacoEditorRef.current?.getModel();
    const selected = selectedUids || selectedItems;
    const helperModel = getEditorModelWithCurrentCode();

    /* We are sorting nodes from the max to the min because this way the nodes of max index are deleted first and they do not affect the nodes with index lower to them in terms of the source code location*/
    const sortedUids = sortDsc
      ? sortUidsByMaxEndIndex(selected, validNodeTree)
      : sortUidsByMinStartIndex(selected, validNodeTree);
    let copiedCode = "";

    sortedUids.forEach((uid) => {
      const node = validNodeTree[uid];
      if (node) {
        const { startLine, startCol, endLine, endCol } =
          node.data.sourceCodeLocation;
        const text =
          codeViewInstanceModel &&
          codeViewInstanceModel.getValueInRange(
            new Range(startLine, startCol, endLine, endCol),
          );
        copiedCode += text;

        // remove the copied code from the original code
        const edit = {
          range: new Range(startLine, startCol, endLine, endCol),
          text: "",
        };
        helperModel.applyEdits([edit]);
      }
    });
    copiedCode = html_beautify(copiedCode);
    pasteToClipboard &&
      (await window.navigator.clipboard.writeText(copiedCode));
    const updatedCode = helperModel.getValue();
    return {
      sortedUids,
      copiedCode,
      updatedCode,
    };
  }

  const parseHtml = async (
    content: string,
    callback?: (validNodeUid: TValidNodeUid) => void,
  ): Promise<THtmlParserResponse> => {
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
    const selectedNodeUids: TNodeUid[] = [];
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
          return `${parentPath}.${node.nodeName}_${index}`;
        }
        return `${node.nodeName}_${index}`;
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

        if (
          needToSelectNodePaths &&
          needToSelectNodePaths.includes(uniqueNodePath)
        ) {
          selectedNodeUids.push(uid);
        }

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

    await dispatch(setSelectedNodeUids(selectedNodeUids));
    await dispatch(focusNodeTreeNode(selectedNodeUids[0]));
    await dispatch(selectNodeTreeNodes(selectedNodeUids));

    return {
      contentInApp,
      nodeTree,
      htmlDom,
      selectedNodeUids,
    };
  };

  const findNodeToSelectAfterAction = async ({
    nodeUids,
    action,
    skipUpdate,
  }: {
    nodeUids: string[];
    action: {
      type: "add" | "remove" | "replace";
      tagNames?: string[];
    };
    skipUpdate?: boolean;
  }) => {
    const uniqueNodePaths: string[] = [];
    if (nodeUids.length === 0) return [];

    const sortedUids = nodeUids;

    for (let i = 0; i < sortedUids.length; i++) {
      const nodeUid = sortedUids[i];
      if (!nodeUid) return;
      const node = validNodeTree[nodeUid];
      if (!node) return;
      const parentUid = node.parentUid;
      if (!parentUid) return;
      const parent = validNodeTree[parentUid];
      if (!parent) return;

      const selectedChildIndex = node?.uniqueNodePath?.split("_").pop();
      if (!selectedChildIndex) return;

      const allTags = action?.tagNames ?? [node.data.tagName];

      let offset = 0;
      let tempPath = node.uniqueNodePath;

      /*TODO: handle selection when #text node 
      is encountered as it is converted to span and the attributes are not added to it*/

      //Find the next node to select after the remove action
      if (action.type === "remove") {
        const childrens = parent.children;
        const totalChildren = childrens.length;
        /* if there are more nodes in the parent other than the one being removed,
          then there are 2 possibilities:
          1. The last child is the one being removed, then the prev child should be selected
          2. The child being removed is not the last child, then the next child should be selected
          */

        /* if there is only one child in the parent, then the next parent should be selected */
        const validNodeTreeKeys = Object.keys(validNodeTree);

        if (childrens.length > 1) {
          // last child unique node path
          const lastChildUid = childrens?.[totalChildren - 1];
          const currentChildIndexInValidNodeTree =
            validNodeTreeKeys.indexOf(nodeUid);
          const prevChildUid =
            validNodeTreeKeys[currentChildIndexInValidNodeTree - 1];
          const prevChild = validNodeTree?.[prevChildUid];

          const nextChildUid =
            validNodeTreeKeys[currentChildIndexInValidNodeTree + 1];
          const nextChild = validNodeTree?.[nextChildUid];
          if (lastChildUid === nodeUid) {
            tempPath = prevChild?.uniqueNodePath;
          } else {
            tempPath = `${parent.uniqueNodePath}.${nextChild?.data.tagName}_${parseInt(
              selectedChildIndex,
            )}`;
          }
        } else {
          const indexOfCurrentParentUid = validNodeTreeKeys.indexOf(parentUid);
          const nextParentUid = validNodeTreeKeys[indexOfCurrentParentUid + 1];

          if (nextParentUid) {
            const nextParent = validNodeTree[nextParentUid];
            if (nextParent) {
              tempPath = nextParent.uniqueNodePath;
            }
          }
        }

        if (tempPath) {
          dispatch(setNeedToSelectNodePaths([tempPath]));
        }

        return;
      } else {
        tempPath = parent.uniqueNodePath;
      }
      if (action.type !== "replace") {
        offset = 1;
      }
      allTags.forEach((tagName, index) => {
        const tag = tagName ?? node.data.tagName;
        const newNodeIndex = parseInt(selectedChildIndex) + offset + index;

        if (tagName === "#text") {
          return;
        }
        // The uniqueNodePath is used to focus on the newly added node
        const uniqueNodePathToFocus = `${tempPath ?? ""}.${tag}_${newNodeIndex}`;
        uniqueNodePaths.push(uniqueNodePathToFocus);
      });
    }
    if (uniqueNodePaths.length === 0 || skipUpdate) return;
    await dispatch(setNeedToSelectNodePaths(uniqueNodePaths));
    return uniqueNodePaths;
  };

  return {
    getEditorModelWithCurrentCode,
    checkAllResourcesAvailable,
    copyAndCutNode,
    parseHtml,
    findNodeToSelectAfterAction,
  };
};
