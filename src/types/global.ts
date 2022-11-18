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

export const generateNodeUID = (PID: string, index: number) => {
  return PID + "_" + index.toString()
}