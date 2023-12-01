import { StageNodeIdAttr, TNodeUid } from "@_node/index";

export const getValidElementWithUid = (ele: HTMLElement): TNodeUid | null => {
  let validElement = ele;
  let uid: TNodeUid | null = validElement.getAttribute(StageNodeIdAttr);
  while (!uid) {
    const parentElement = validElement.parentElement;
    if (!parentElement) break;

    uid = parentElement.getAttribute(StageNodeIdAttr);
    validElement = parentElement;
  }
  return uid;
};

export const markSelectedElements = (
  contentRef: HTMLIFrameElement | null,
  uids: TNodeUid[],
) => {
  uids.map((uid) => {
    // if it's a web component, should select its first child element
    let selectedElement = contentRef?.contentWindow?.document?.querySelector(
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
  contentRef: HTMLIFrameElement | null,
  uids: TNodeUid[],
) => {
  uids.map((uid) => {
    // if it's a web component, should select its first child element
    let selectedElement = contentRef?.contentWindow?.document?.querySelector(
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
  contentRef: HTMLIFrameElement | null,
  uid: TNodeUid,
) => {
  // if it's a web component, should select its first child element
  let selectedElement = contentRef?.contentWindow?.document?.querySelector(
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
  contentRef: HTMLIFrameElement | null,
  uid: TNodeUid,
) => {
  // if it's a web component, should select its first child element
  let selectedElement = contentRef?.contentWindow?.document?.querySelector(
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

export const selectAllText = (
  contentRef: HTMLIFrameElement | null,
  ele: HTMLElement,
) => {
  const range = contentRef?.contentWindow?.document.createRange();
  if (range) {
    range.selectNodeContents(ele);
    const selection = contentRef?.contentWindow?.getSelection();
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
