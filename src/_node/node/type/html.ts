import { DOMElement } from "react";

import { Document } from "parse5/dist/tree-adapters/default";

import {
  TNode,
  TNodeData,
  TNodeSourceCodeLocation,
  TNodeTreeData,
  TNodeUid,
} from "../../";

export type THtmlNode = TNode & {
  data: THtmlNodeData;
};

export type THtmlNodeData = TNodeData & {
  nodeName: string;
  tagName: string;
  textContent: string;

  attribs: THtmlNodeAttribs;

  sourceCodeLocation: TNodeSourceCodeLocation;
};

export type THtmlNodeAttribs = {
  [attrName: string]: any;
};

export type THtmlNodeTreeData = {
  [uid: TNodeUid]: THtmlNode;
};

export type THtmlDomNode = DOMElement<any, HTMLElement> & {
  [attrName: string]: any;
};

export type THtmlParserResponse = {
  contentInApp: string;
  nodeTree: TNodeTreeData;
  htmlDom: Document;
};

// --------------------
export type THtmlPageSettings = {
  title: string;
  favicon: string[];
  scripts: TNode[];
};
