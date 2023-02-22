/**
 * files reference data
 */
export type TFilesReferenceData = {
  [name: string]: TFilesReference,
}

/**
 * files reference
 */
export type TFilesReference = {
  "Name": string,
  "Extension": string,
  "Type": string,
  "Icon": string,
  "Description": string,
  "Featured": string,
}