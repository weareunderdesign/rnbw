/**
 * response type for "selectFolderFromModal" api
 */
export type FolderSelectModalResponse = {
  success: boolean,
  path?: string,
  error?: string,
}

/**
 * ff api response type
 */
export type FFApiRes = {
  success: boolean,
  data?: string,
  error?: string,
}

/**
 * ref to parsable file types
 */
export type ParsableType = {
  [ext: string]: boolean,
}
export const parsable: ParsableType = {/* parsable file types - we need this since the app can classify but impossible to parse it */
  "html": true,
  "css": false,
  "js": false,
  "md": false,
}