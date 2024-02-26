import { editor } from "monaco-editor";

import {
  NodeActions,
  StageNodeIdAttr,
  TNodeTreeData,
  TNodeUid,
} from "@_node/index";
import { AnyAction, Dispatch } from "@reduxjs/toolkit";

export const getValidElementWithUid = (
  ele: HTMLElement,
): { uid: TNodeUid | null; element: HTMLElement } => {
  let validElement = ele;
  let uid: TNodeUid | null = validElement.getAttribute(StageNodeIdAttr);
  while (!uid) {
    const parentElement = validElement.parentElement;
    if (!parentElement) break;

    uid = parentElement.getAttribute(StageNodeIdAttr);
    validElement = parentElement;
  }
  return { uid, element: validElement };
};

export const markSelectedElements = (
  iframeRef: HTMLIFrameElement | null,
  uids: TNodeUid[],
) => {
  uids.map((uid) => {
    // if it's a web component, should select its first child element
    let selectedElement = iframeRef?.contentWindow?.document?.querySelector(
      `[${StageNodeIdAttr}="${uid}"]`,
    );
    const isValid: null | string = selectedElement?.firstElementChild
      ? selectedElement?.firstElementChild.getAttribute(StageNodeIdAttr)
      : "";
    isValid === null
      ? (selectedElement = selectedElement?.firstElementChild)
      : null;
    selectedElement?.setAttribute("rnbwdev-rnbw-element-select", "");
  });
};
export const unmarkSelectedElements = (
  iframeRef: HTMLIFrameElement | null,
  uids: TNodeUid[],
) => {
  uids.map((uid) => {
    // if it's a web component, should select its first child element
    let selectedElement = iframeRef?.contentWindow?.document?.querySelector(
      `[${StageNodeIdAttr}="${uid}"]`,
    );
    const isValid: null | string = selectedElement?.firstElementChild
      ? selectedElement?.firstElementChild.getAttribute(StageNodeIdAttr)
      : "";
    isValid === null
      ? (selectedElement = selectedElement?.firstElementChild)
      : null;
    selectedElement?.removeAttribute("rnbwdev-rnbw-element-select");
  });
};

export const markHoverdElement = (
  iframeRef: HTMLIFrameElement | null,
  uid: TNodeUid,
) => {
  // if it's a web component, should select its first child element
  let selectedElement = iframeRef?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${uid}"]`,
  );
  const isValid: null | string = selectedElement?.firstElementChild
    ? selectedElement?.firstElementChild.getAttribute(StageNodeIdAttr)
    : "";
  isValid === null
    ? (selectedElement = selectedElement?.firstElementChild)
    : null;
  selectedElement?.setAttribute("rnbwdev-rnbw-element-hover", "");
};
export const unmarkHoverdElement = (
  iframeRef: HTMLIFrameElement | null,
  uid: TNodeUid,
) => {
  // if it's a web component, should select its first child element
  let selectedElement = iframeRef?.contentWindow?.document?.querySelector(
    `[${StageNodeIdAttr}="${uid}"]`,
  );
  const isValid: null | string = selectedElement?.firstElementChild
    ? selectedElement?.firstElementChild.getAttribute(StageNodeIdAttr)
    : "";
  isValid === null
    ? (selectedElement = selectedElement?.firstElementChild)
    : null;
  selectedElement?.removeAttribute("rnbwdev-rnbw-element-hover");
};

export const editHtmlContent = ({
  dispatch,
  iframeRef,
  nodeTree,
  contentEditableUid,
  codeViewInstanceModel,
  setIsContentProgrammaticallyChanged,
  formatCode,
  cb,
}: {
  dispatch: Dispatch<AnyAction>;
  iframeRef: HTMLIFrameElement;
  nodeTree: TNodeTreeData;
  contentEditableUid: TNodeUid;
  codeViewInstanceModel: editor.ITextModel;
  setIsContentProgrammaticallyChanged: (value: boolean) => void;
  formatCode: boolean;
  cb?: () => void;
}) => {
  const contentEditableElement =
    iframeRef.contentWindow?.document.querySelector(
      `[${StageNodeIdAttr}="${contentEditableUid}"]`,
    ) as HTMLElement;

  if (contentEditableElement) {
    contentEditableElement.setAttribute("contenteditable", "false");
    //the first \n is replaced by "" as the first line break that is by default added by the contenteditable
    let content = contentEditableElement.innerHTML.replace(/\n/, "")
    content = content.replace(/\n/g, "<br/>");


    setIsContentProgrammaticallyChanged(true);
    NodeActions.edit({
      nodeTree,
      targetUid: contentEditableUid,
      content: content ? content : "",
      codeViewInstanceModel,
      formatCode,
      fb: () => setIsContentProgrammaticallyChanged(false),
      cb,
    });
  }
};

export const selectAllText = (
  iframeRef: HTMLIFrameElement | null,
  ele: HTMLElement,
) => {
  const range = iframeRef?.contentWindow?.document.createRange();
  if (range) {
    range.selectNodeContents(ele);
    const selection = iframeRef?.contentWindow?.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
};

// -----------------------
export const openNewPage = (ele: HTMLElement) => {
  if (ele.tagName !== "A") return;

  const anchorElement = ele as HTMLAnchorElement;
  if (anchorElement.href) {
    window.open(anchorElement.href, "_blank", "noreferrer");
  }
};
