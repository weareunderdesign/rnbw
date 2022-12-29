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