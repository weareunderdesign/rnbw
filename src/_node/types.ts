/**
 * unique id for each node
 */
export type TUid = string


/**
 * node data object type
 */
export type TNode = {
  uid: TUid,/* unique id */
  p_uid: TUid | null,/* parent's unique id - null if it has no parent */
  name: string,/* text to be displayed at the node on the tree view */
  isEntity: boolean,/* true if it's an entity */
  children: TUid[],/* children uid list, empty array if it has no child */
  data: any,/* any reference data you want */
}

/**
 * tree data object type
 */
export type TTree = {
  [uid: TUid]: TNode,
}

/**
 * node api res type
 */
export type TNodeApiRes = {
  success: boolean,/* true if successfully done */
  error?: string,/* error message if failed */
}

/**
 * add node api payload type
 */
export type TAddNodePayload = {
  tree: TTree,/* tree data */
  targetUid: TUid,/* target node uid */
  node: TNode,/* node to add */
}

/**
 * remove node api payload type
 */
export type TRemoveNodePayload = {
  tree: TTree,/* tree data */
  nodeUids: TUid[],/* node uids to remove - array for multiple feature */
}

/**
 * replace node api payload type
 */
export type TReplaceNodePayload = {
  tree: TTree,/* tree data */
  node: TNode,/* node to replace */
}

/**
 * move(cut & paste) node api payload type
 */
export type TMoveNodePayload = {
  tree: TTree,/* tree data */
  isBetween: boolean,/* true if it's reorder */
  parentUid: TUid,/* parent uid which will be the parent of the nodes */
  position?: {/* undefined if it's not reorder */
    childIndex: number,
    side: 'top' | 'bottom',
  },
  nodes: TNode[],/* nodes to move - array for multiple feature */
}

/**
 * duplicate(copy & paste) node api payload type
 */
export type TDuplicateNodePayload = {
  tree: TTree,/* tree data */
  isBetween: boolean,/* true if it's reorder */
  parentUid: TUid,/* parent uid which will be the parent of the nodes */
  position?: {/* undefined if it's not reorder */
    childIndex: number,
    side: 'top' | 'bottom',
  },
  nodes: TNode[],/* nodes to duplicate - array for multiple feature */
}

/**
 * ref to valid file types
 */
export type TFileType = 'html' | 'css' | 'js' | 'md' | 'unknown'/* file types that the app can classify */

/**
 * parse file api payload type
 */
export type TParseFilePayload = {
  type: string,
  content: string,
}

/**
 * searialize file api payload type
 */
export type TSearializeFilePayload = {
  type: string,
  tree: TTree,
}