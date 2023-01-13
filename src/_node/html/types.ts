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
  tag: string,
  name: string,
  type: string,
  contain: string,
  description: string,
  icon: string,
  content: string,
  placeholder: string,
  coverImage: string,
}

export type THtmlReferenceData = {
  [tag: string]: THtmlReference,
}