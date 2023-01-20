import { TTree } from '../';

/**
 * the response type for parseHTML api
 */
export type THtmlParserResponse = {
  content: string, //newContent in rainbow style
  tree: TTree,
}

/**
 * html element attribtues type
 */
export type THtmlTagAttributes = {
  [attrName: string]: any,
}

/**
 * html reference csv format
 */
export type THtmlReference = {
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

export type THtmlReferenceData = {
  [tag: string]: THtmlReference,
}