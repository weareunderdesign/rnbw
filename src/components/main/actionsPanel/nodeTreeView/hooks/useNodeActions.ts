import { useCallback, useContext } from "react";

import { Range } from "monaco-editor";
import { useDispatch, useSelector } from "react-redux";

import { StageNodeIdAttr, getValidNodeUids } from "@_node/index";
import { TNodeUid } from "@_node/types";
import { osTypeSelector } from "@_redux/global";
import { MainContext } from "@_redux/main";
import { codeViewTabSizeSelector } from "@_redux/main/codeView";
import {
  nodeTreeSelector,
  nodeTreeViewStateSelector,
  validNodeTreeSelector,
} from "@_redux/main/nodeTree";
import {
  clipboardDataSelector,
  setUpdateOptions,
} from "@_redux/main/processor";

import { getTree } from "../helpers/getTree";
import { useEditor } from "@_components/main/codeView/hooks";
import {
  getCopiedContent,
  sortUidsByMaxEndIndex,
  sortUidsByMinStartIndex,
} from "../helpers";

export function useNodeActions() {
  const dispatch = useDispatch();

  const nodeTree = useSelector(nodeTreeSelector);
  const validNodeTree = useSelector(validNodeTreeSelector);
  const { focusedItem } = useSelector(nodeTreeViewStateSelector);
  const codeViewTabSize = useSelector(codeViewTabSizeSelector);
  const clipboardData = useSelector(clipboardDataSelector);

  const osType = useSelector(osTypeSelector);
  const {
    // references
    htmlReferenceData,
    // other
    monacoEditorRef,
    setIsContentProgrammaticallyChanged,
    addRunningActions,
    removeRunningActions,
  } = useContext(MainContext);

  const { handleEditorChange } = useEditor();

  const cb_addNode = (nodeType: string) => {
    const focusedNode = validNodeTree[focusedItem];

    if (!focusedNode?.uid) {
      console.error("Focused node is undefined");
      return;
    }

    const selectedNode = validNodeTree[focusedNode.uid];
    if (!selectedNode || !selectedNode.data.sourceCodeLocation) {
      console.error("Parent node or source code location is undefined");
      return;
    }

    const { endLine, endCol } = selectedNode.data.sourceCodeLocation;
    const model = monacoEditorRef.current?.getModel();

    if (!model) {
      console.error("Monaco Editor model is undefined");
      return;
    }
    const HTMLElement = htmlReferenceData.elements[nodeType];

    let openingTag = HTMLElement.Tag;

    if (HTMLElement.Attributes) {
      const tagArray = openingTag.split("");
      tagArray.splice(tagArray.length - 1, 0, ` ${HTMLElement.Attributes}`);
      openingTag = tagArray.join("");
    }
    const closingTag = `</${nodeType}>`;

    const tagContent = !!HTMLElement.Content ? HTMLElement.Content : "";

    const codeViewText =
      HTMLElement.Contain === "None"
        ? openingTag
        : `${openingTag}${tagContent}${closingTag}`;

    const position = { lineNumber: endLine, column: endCol + 1 };
    const range = new Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    );
    const editOperation = { range, text: "\n" + codeViewText };

    model.pushEditOperations([], [editOperation], () => null);
    monacoEditorRef.current?.setPosition({
      lineNumber: position.lineNumber + 1,
      column: 1,
    });

    const content = model.getValue();
    handleEditorChange(content);
  };

  const cb_removeNode = useCallback(
    (uids: TNodeUid[]) => {
      const model = monacoEditorRef.current?.getModel();
      if (!model) return;
      setIsContentProgrammaticallyChanged(true);
      let parentUids = [] as TNodeUid[];
      uids.forEach((uid) => {
        let node = nodeTree[uid];

        if (node) {
          let parentUid = node.parentUid;
          if (parentUid) {
            parentUids.push(parentUid);
          }
          const {
            endCol: endColumn,
            endLine: endLineNumber,
            startCol: startColumn,
            startLine: startLineNumber,
          } = node.data.sourceCodeLocation;

          const range = new Range(
            startLineNumber,
            startColumn,
            endLineNumber,
            endColumn,
          );
          let edit = {
            range: range,
            text: "",
          };
          model.applyEdits([edit]);
        }
      });

      const content = model.getValue();
      handleEditorChange(content, {
        matchIds: uids,
      });
    },
    [addRunningActions, removeRunningActions, nodeTree],
  );

  const cb_duplicateNode = (uids: TNodeUid[]) => {
    const iframe: any = document.getElementById("iframeId");
    const model = monacoEditorRef.current?.getModel();
    if (!model) {
      console.error("Monaco Editor model is undefined");
      return;
    }
    setIsContentProgrammaticallyChanged(true);
    let content = model.getValue();

    const sortedUids = sortUidsByMaxEndIndex(uids, validNodeTree);

    sortedUids.forEach(async (uid) => {
      const cleanedUpCode = getCopiedContent(uid, iframe);

      if (!cleanedUpCode) return;

      const selectedNode = validNodeTree[uid];
      if (!selectedNode || !selectedNode.data.sourceCodeLocation) {
        console.error("Parent node or source code location is undefined");
        return;
      }
      const { endLine, endCol } = selectedNode.data.sourceCodeLocation;

      const position = { lineNumber: endLine, column: endCol + 1 };

      const range = new Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column,
      );
      const editOperation = { range, text: "\n" + cleanedUpCode };

      model.pushEditOperations([], [editOperation], () => null);
      monacoEditorRef.current?.setPosition({
        lineNumber: position.lineNumber + 1,
        column: 1,
      });

      content = model.getValue();
    });

    handleEditorChange(content);
  };

  const cb_copyNode = (uids: TNodeUid[]) => {
    const iframe: any = document.getElementById("iframeId");
    let copiedCode = "";

    uids.forEach((uid) => {
      const cleanedUpCode = getCopiedContent(uid, iframe);

      if (!cleanedUpCode) return;

      copiedCode += cleanedUpCode + "\n";
    });
    //copy the cleaned up code to clipboard
    window.navigator.clipboard.writeText(copiedCode);
  };

  const cb_moveNode = useCallback(
    (_uids: TNodeUid[], targetUid: TNodeUid) => {
      // validate
      const uids = getValidNodeUids(
        nodeTree,
        _uids,
        targetUid,
        "html",
        htmlReferenceData,
      );
      if (uids.length === 0) return;

      addRunningActions(["nodeTreeView-move"]);

      // call api
      const tree = getTree(nodeTree);

      // processor
      addRunningActions(["processor-updateOpt"]);
      dispatch(setUpdateOptions({ parse: false, from: "node" }));

      // view state
      addRunningActions(["stageView-viewState"]);
      dispatch(setUpdateOptions({ parse: true, from: "code" }));
      // side effect

      removeRunningActions(["nodeTreeView-move"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      nodeTree,
      htmlReferenceData,
      osType,
      codeViewTabSize,
    ],
  );

  const cb_groupNode = (uids: TNodeUid[]) => {
    const iframe: any = document.getElementById("iframeId");
    let copiedCode = "";

    const sortedUids = sortUidsByMinStartIndex(uids, validNodeTree);

    sortedUids.forEach((uid) => {
      const cleanedUpCode = getCopiedContent(uid, iframe);

      if (!cleanedUpCode) return;

      copiedCode += cleanedUpCode + "\n";
    });

    const { startLine, startCol } =
      validNodeTree[sortedUids[0]].data.sourceCodeLocation;

    const model = monacoEditorRef.current?.getModel();
    if (!model) return;
    let focusLineNumber = 0;
    let parentUids = [] as TNodeUid[];

    uids.forEach((uid) => {
      let node = validNodeTree[uid];

      if (node) {
        let parentUid = node.parentUid;
        if (parentUid) {
          parentUids.push(parentUid);
        }
        const {
          endCol: endColumn,
          endLine: endLineNumber,
          startCol: startColumn,
          startLine: startLineNumber,
        } = node.data.sourceCodeLocation;

        const range = new Range(
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn,
        );
        let edit = {
          range: range,
          text: "",
        };
        model.applyEdits([edit]);
        focusLineNumber = startLineNumber;
      }
    });

    const position = { lineNumber: startLine, column: startCol };
    const range = new Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    );
    const editOperation = {
      range,
      text: "<div>" + "\n" + copiedCode + "</div>",
    };

    model.pushEditOperations([], [editOperation], () => null);
    monacoEditorRef.current?.setPosition({
      lineNumber: position.lineNumber + 1,
      column: 1,
    });

    const content = model.getValue();
    handleEditorChange(content, {
      matchIds: uids,
    });
  };

  const cb_ungroupNode = (uids: TNodeUid[]) => {
    const iframe: any = document.getElementById("iframeId");
    const model = monacoEditorRef.current?.getModel();
    if (!model) {
      console.error("Monaco Editor model is undefined");
      return;
    }
    setIsContentProgrammaticallyChanged(true);
    let content = model.getValue();

    const sortedUids = sortUidsByMaxEndIndex(uids, validNodeTree);

    sortedUids.forEach((uid) => {
      // const cleanedUpCode = getCopiedContent(uid, iframe);

      const ele = iframe?.contentWindow?.document?.querySelector(
        `[${StageNodeIdAttr}="${uid}"]`,
      );

      //create a copy of ele
      const eleCopy = ele?.cloneNode(true) as HTMLElement;
      const innerElements = eleCopy.querySelectorAll(`[${StageNodeIdAttr}]`);

      innerElements.forEach((element) => {
        if (element.hasAttribute(StageNodeIdAttr)) {
          element.removeAttribute(StageNodeIdAttr);
        }
      });

      eleCopy?.removeAttribute("contenteditable");
      eleCopy?.removeAttribute("rnbwdev-rnbw-element-hover");
      eleCopy?.removeAttribute("rnbwdev-rnbw-element-select");
      eleCopy?.removeAttribute(StageNodeIdAttr);
      const cleanedUpCode = eleCopy?.innerHTML;

      //delete the copy
      eleCopy?.remove();

      if (!cleanedUpCode) return;

      const selectedNode = validNodeTree[uid];
      const selectedNodeChildren = selectedNode.children.length;

      if (!selectedNodeChildren) return;

      if (!selectedNode || !selectedNode.data.sourceCodeLocation) {
        console.error("Parent node or source code location is undefined");
        return;
      }

      let parentUids = [] as TNodeUid[];

      let parentUid = selectedNode.parentUid;

      if (parentUid) {
        parentUids.push(parentUid);
      }
      const {
        endCol: endColumn,
        endLine: endLineNumber,
        startCol: startColumn,
        startLine: startLineNumber,
      } = selectedNode.data.sourceCodeLocation;

      const range = new Range(
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      );

      let edit = {
        range: range,
        text: "",
      };
      model.applyEdits([edit]);

      const newRange = new Range(
        startLineNumber,
        startColumn,
        startLineNumber,
        startColumn,
      );

      const editOperation = { range: newRange, text: cleanedUpCode };

      model.pushEditOperations([], [editOperation], () => null);
      monacoEditorRef.current?.setPosition({
        lineNumber: startLineNumber + 1,
        column: 1,
      });

      content = model.getValue();
    });

    handleEditorChange(content);
  };

  return {
    cb_addNode,
    cb_removeNode,
    cb_duplicateNode,
    cb_copyNode,
    cb_moveNode,
    cb_groupNode,
    cb_ungroupNode,
  };
}
