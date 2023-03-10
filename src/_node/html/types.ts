import { DOMElement } from 'react';

import {
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '../';

/**
 * html node-data type
 */
export type THtmlNodeData = {
  valid: boolean,
  isFormatText: boolean,

  isWebComponent: boolean,

  type: string,
  name: string,
  data: string,
  attribs: THtmlTagAttributes,

  html: string,
  startLineNumber: number,
  startColumn: number,
  endLineNumber: number,
  endColumn: number,

  hasOrgClass: boolean,
}

/**
 * html element attribtues type
 */
export type THtmlTagAttributes = {
  [attrName: string]: any,
}

/**
 * parseHtml api response type
 */
export type THtmlParserResponse = {
  formattedContent: string,
  tree: TNodeTreeData,
  info: THtmlSettings,
}

/**
 * html processable node type - dom element
 */
export interface THtmlProcessableNode extends DOMElement<any, HTMLElement> {
  valid: boolean,
  uid: TNodeUid,

  [attrName: string]: any,
}

/**
 * html reference data
 */
export type THtmlReferenceData = {
  elements: THtmlElementsReferenceData,
}

/**
 * html elements reference data
 */
export type THtmlElementsReferenceData = {
  [tag: string]: THtmlElementsReference,
}

/**
 * html element reference
 */
export type THtmlElementsReference = {
  "Featured": string,
  "Tag": string,
  "Name": string,
  "Type": string,
  "Contain": string,
  "Description": string,
  "Icon": string,
  "Content": string,
  "Placeholder": string,
  "Cover Image": string,
}

/**
 * html settings info
 */
export type THtmlSettings = {
  html?: string,
  head?: string,
  body?: string,

  scripts: TNode[],

  title?: string,
  favicon: string[],
}