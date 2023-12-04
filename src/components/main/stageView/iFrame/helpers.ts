import {
  StageNodeIdAttr,
  TNodeTreeData,
  TNodeUid,
  callNodeApi,
} from "@_node/index";
import { editor } from "monaco-editor";

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
  iframeRefState: HTMLIFrameElement | null,
  uids: TNodeUid[],
) => {
  uids.map((uid) => {
    // if it's a web component, should select its first child element
    let selectedElement =
      iframeRefState?.contentWindow?.document?.querySelector(
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
  iframeRefState: HTMLIFrameElement | null,
  uids: TNodeUid[],
) => {
  uids.map((uid) => {
    // if it's a web component, should select its first child element
    let selectedElement =
      iframeRefState?.contentWindow?.document?.querySelector(
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
  iframeRefState: HTMLIFrameElement | null,
  uid: TNodeUid,
) => {
  // if it's a web component, should select its first child element
  let selectedElement = iframeRefState?.contentWindow?.document?.querySelector(
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
  iframeRefState: HTMLIFrameElement | null,
  uid: TNodeUid,
) => {
  // if it's a web component, should select its first child element
  let selectedElement = iframeRefState?.contentWindow?.document?.querySelector(
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
  iframeRefState,
  nodeTree,
  contentEditableUid,
  codeViewInstanceModel,
  setIsContentProgrammaticallyChanged,
}: {
  iframeRefState: HTMLIFrameElement;
  nodeTree: TNodeTreeData;
  contentEditableUid: TNodeUid;
  codeViewInstanceModel: editor.ITextModel;
  setIsContentProgrammaticallyChanged: (value: boolean) => void;
}) => {
  const contentEditableElement =
    iframeRefState.contentWindow?.document.querySelector(
      `[${StageNodeIdAttr}="${contentEditableUid}"]`,
    );
  if (contentEditableElement) {
    contentEditableElement.setAttribute("contenteditable", "false");

    setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        action: "text-edit",
        nodeTree,
        targetUid: contentEditableUid,
        content: contentEditableElement.innerHTML,
        codeViewInstanceModel,
      },
      () => setIsContentProgrammaticallyChanged(false),
    );
  }
};

// -----------------------
export const selectAllText = (
  iframeRefState: HTMLIFrameElement | null,
  ele: HTMLElement,
) => {
  const range = iframeRefState?.contentWindow?.document.createRange();
  if (range) {
    range.selectNodeContents(ele);
    const selection = iframeRefState?.contentWindow?.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
};

export const openNewPage = (ele: HTMLElement) => {
  if (ele.tagName !== "A") return;

  const anchorElement = ele as HTMLAnchorElement;
  if (anchorElement.href) {
    window.open(anchorElement.href, "_blank", "noreferrer");
  }
};
