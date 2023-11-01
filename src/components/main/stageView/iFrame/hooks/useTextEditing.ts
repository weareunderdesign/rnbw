import { useCallback, useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { NodeInAppAttribName, RootNodeUid } from "@_constants/main";
import { TNode, TNodeUid } from "@_node/types";
import {
  MainContext,
  expandFFNode,
  ffSelector,
  fnSelector,
} from "@_redux/main";
import { getCommandKey } from "@_services/global";
import { TCmdkKeyMap } from "@_types/main";
import { useSetSelectItem } from "./useSetSelectItem";
import { THtmlNodeData } from "@_node/html";
import { TFileNodeData } from "@_node/file";
import { handleElementClick, openNewPage } from "../helpers";
import { useEditor } from "@_components/main/codeView/hooks";

export interface IUseTextEditingProps {
  contentEditableUidRef: React.MutableRefObject<string>;
  contentRef: HTMLIFrameElement | null;
  isEditing: React.MutableRefObject<boolean>;
  mostRecentSelectedNode: React.MutableRefObject<TNode | undefined>;
  focusedItemRef: React.MutableRefObject<string>;
  dblClickTimestamp: React.MutableRefObject<number>;
  externalDblclick: React.MutableRefObject<boolean>;
}

export const useTextEditing = ({
  contentEditableUidRef,
  contentRef,
  isEditing,
  mostRecentSelectedNode,
  focusedItemRef,
  dblClickTimestamp,
  externalDblclick,
}: IUseTextEditingProps) => {
  const dispatch = useDispatch();
  const { focusedItem } = useSelector(fnSelector);
  const { expandedItemsObj } = useSelector(ffSelector);
  const { handleEditorChange } = useEditor();
  const {
    // node actions
    setNavigatorDropDownType,
    // file tree view
    ffTree,
    setInitialFileToOpen,
    // node tree view
    validNodeTree,
    // other
    osType,
    // close all panel
    closeAllPanel,
    monacoEditorRef,
    setIsContentProgrammaticallyChanged,
  } = useContext(MainContext);

  const { setFocusedSelectedItems } = useSetSelectItem({
    mostRecentSelectedNode,
    focusedItemRef,
    contentRef,
  });

  const beforeTextEdit = useCallback(() => {
    let node = validNodeTree[contentEditableUidRef.current];
    if (!node) return;
    setIsContentProgrammaticallyChanged(true);
    let editableId = contentEditableUidRef.current;
    contentEditableUidRef.current = "";

    let ele = contentRef?.contentWindow?.document?.querySelector(
      `[${NodeInAppAttribName}="${editableId}"]`,
    );
    //create a copy of ele
    const eleCopy = ele?.cloneNode(true) as HTMLElement;
    ele?.removeAttribute("contenteditable");
    eleCopy?.removeAttribute("contenteditable");
    eleCopy?.removeAttribute("rnbwdev-rnbw-element-hover");
    eleCopy?.removeAttribute("rnbwdev-rnbw-element-select");
    eleCopy?.removeAttribute("data-rnbwdev-rnbw-node");
    const cleanedUpCode = eleCopy?.outerHTML;
    //delete the copy
    eleCopy?.remove();
    if (!cleanedUpCode) return;

    //current code range in monaco editor
    const {
      endCol: endColumn,
      endLine: endLineNumber,
      startCol: startColumn,
      startLine: startLineNumber,
    } = node.sourceCodeLocation;

    //replace the content in this range with the cleaned up code
    const model = monacoEditorRef.current?.getModel();
    if (!model) return;
    const range = {
      endColumn,
      endLineNumber,
      startColumn,
      startLineNumber,
    };
    const id = model.getValueInRange(range);
    const newModelValue = model.getValue().replace(id, cleanedUpCode);
    model.setValue(newModelValue);
    monacoEditorRef.current?.setModel(model);
    monacoEditorRef.current?.focus();
    monacoEditorRef.current?.setPosition({
      column: startColumn,
      lineNumber: startLineNumber,
    });
    monacoEditorRef.current?.revealLineInCenter(startLineNumber);
    //give all the content inside the editor
    const content = model.getValue();

    handleEditorChange(content, {
      matchIds: [editableId],
    });
  }, [focusedItem]);

  const onCmdEnter = useCallback(
    (e: KeyboardEvent) => {
      // cmdk obj for the current command
      const cmdk: TCmdkKeyMap = {
        cmd: getCommandKey(e, osType),
        shift: e.shiftKey,
        alt: e.altKey,
        key: e.code,
        click: false,
      };

      if (e.key === "Escape") {
        //https://github.com/rnbwdev/rnbw/issues/240
        if (contentEditableUidRef.current !== "") {
          const ele = contentRef?.contentWindow?.document?.querySelector(
            `[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`,
          );
          ele?.removeAttribute("contenteditable");
          contentEditableUidRef.current = "";
          return;
        }
        //
        closeAllPanel();
        return;
      }

      if (cmdk.cmd && cmdk.key === "KeyG") {
        e.preventDefault();
        e.stopPropagation();
        // return
      }

      if (cmdk.cmd && cmdk.key === "Enter") {
        const ele = contentRef?.contentWindow?.document?.querySelector(
          `[${NodeInAppAttribName}="${contentEditableUidRef.current}"]`,
        );
        if (!ele) return;
        (ele as HTMLElement).blur();
        setFocusedSelectedItems(focusedItem);
      }
    },
    [focusedItem, validNodeTree, contentRef],
  );

  const handleWebComponentClick = (ele: HTMLElement) => {
    let flag = true;
    let exist = false;
    if (!externalDblclick.current) {
      while (flag) {
        if (ele.getAttribute(NodeInAppAttribName) !== null) {
          const uid = ele.getAttribute(NodeInAppAttribName);
          if (uid) {
            for (let x in ffTree) {
              const node = validNodeTree[uid];
              const defineRegex = /customElements\.define\(\s*['"]([\w-]+)['"]/;
              if (
                (ffTree[x].data as TFileNodeData).content &&
                (ffTree[x].data as TFileNodeData).ext === ".js"
              ) {
                const match = (ffTree[x].data as TFileNodeData).content.match(
                  defineRegex,
                );
                if (match) {
                  if (ele.tagName.toLowerCase() === match[1].toLowerCase()) {
                    const fileName = (ffTree[x].data as TFileNodeData).name;
                    let src = "";
                    for (let i in validNodeTree) {
                      if (
                        (validNodeTree[i].data as THtmlNodeData).type ===
                          "script" &&
                        (validNodeTree[i].data as THtmlNodeData).html.search(
                          fileName + ".js",
                        ) !== -1
                      ) {
                        src = (validNodeTree[i].data as THtmlNodeData).attribs
                          .src;
                        break;
                      }
                    }
                    if (src !== "") {
                      if (src.startsWith("http") || src.startsWith("//")) {
                        alert("rnbw couldn't find its source file");
                        flag = false;
                        break;
                      } else {
                        setInitialFileToOpen(ffTree[x].uid);
                        setNavigatorDropDownType("project");
                        const _expandedItems = [];
                        let _file = ffTree[x];
                        while (_file && _file.uid !== RootNodeUid) {
                          _file = ffTree[_file.parentUid as string];
                          if (
                            _file &&
                            !_file.isEntity &&
                            (!expandedItemsObj[_file.uid] ||
                              expandedItemsObj[_file.uid] === undefined)
                          ) {
                            _expandedItems.push(_file.uid);
                          }
                        }
                        dispatch(expandFFNode(_expandedItems));
                        flag = false;
                        exist = true;
                        break;
                      }
                    }
                  }
                }
              }
            }
            flag = false;
          } else {
            flag = false;
          }
        } else if (ele.parentElement) {
          ele = ele.parentElement;
        } else {
          flag = false;
        }
      }
    } else {
      exist = true;
    }

    if (!exist) {
      alert("rnbw couldn't find its source file");
    }
  };

  const onDblClick = useCallback(
    (e: MouseEvent) => {
      const ele = e.target as HTMLElement;
      if (
        dblClickTimestamp.current !== 0 &&
        e.timeStamp - dblClickTimestamp.current < 500
      )
        return;
      dblClickTimestamp.current = e.timeStamp;

      openNewPage(ele);

      let uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName);
      if (uid) {
        handleElementClick(
          ele,
          uid,
          contentRef,
          contentEditableUidRef,
          isEditing,
          e,
          validNodeTree,
        );
      } else {
        isEditing.current = false;
        // handleWebComponentClick(ele);
      }
    },
    [validNodeTree, ffTree, expandedItemsObj, contentRef],
  );

  return {
    beforeTextEdit,
    onCmdEnter,
    onDblClick,
  };
};
