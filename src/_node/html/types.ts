import { TTree } from '../';

/**
 * type for html info such as meta, link, title, etc..
 */
export type THtmlInfo = {
  titles: string[],
  links: object[],
}

/**
 * the response type for parseHTML api
 */
export type THtmlParserResponse = {
  content: string, //newContent in rainbow style
  tree: TTree,
  info: THtmlInfo,
}

/**
 * html element attribtues type
 */
export type Attributes = {
  [attrName: string]: any,
}