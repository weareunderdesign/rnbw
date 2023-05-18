import { DOMElement } from 'react';

import {
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '../';

export type THtmlNodeData = {
  valid: boolean,
  isFormatText: boolean,

  type: string,
  name: string,
  data: string,
  attribs: THtmlNodeAttributes,

  html: string,
  htmlInApp: string,

  startLineNumber: number,
  startColumn: number,
  endLineNumber: number,
  endColumn: number,
}
export type THtmlNodeAttributes = {
  [attrName: string]: any,
}
export interface THtmlDomNodeData extends DOMElement<any, HTMLElement> {
  valid: boolean,
  [attrName: string]: any,
}
export type THtmlParserResponse = {
  formattedContent: string,
  contentInApp: string,
  tree: TNodeTreeData,
  nodeMaxUid: TNodeUid,
}
export type THtmlElementsReference = {
  "Featured": string,
  "Tag": string,
  "Name": string,
  "Type": string,
  "Contain": string,
  "Description": string,
  "Icon": string,
  "Content": string,
  "Attributes": string,
  "Cover Image": string,
}
export type THtmlElementsReferenceData = {
  [tag: string]: THtmlElementsReference,
}
export type THtmlReferenceData = {
  elements: THtmlElementsReferenceData,
}
export type THtmlPageSettings = {
  title: string,
  favicon: string[],
  scripts: TNode[],
}