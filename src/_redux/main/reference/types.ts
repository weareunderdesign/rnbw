// file reference
export type TFilesReferenceData = {
  [name: string]: TFilesReference;
};
export type TFilesReference = {
  Name: string;
  Extension: string;
  Type: string;
  Icon: string;
  Description: string;
  Featured: string;
};

// html reference
export type THtmlReferenceData = {
  elements: THtmlElementsReferenceData;
};
export type THtmlElementsReferenceData = {
  [tag: string]: THtmlElementsReference;
};
export type THtmlElementsReference = {
  Featured: string;
  Tag: string;
  Name: string;
  Type: string;
  Contain: string;
  Description: string;
  Icon: string;
  Content: string;
  Attributes: string;
  "Cover Image": string;
};

export type TReferenceReducerState = {
  filesReferenceData: TFilesReferenceData;
  htmlReferenceData: THtmlReferenceData;
  isContentProgrammaticallyChanged: boolean;
  isCodeTyping: boolean;
};
