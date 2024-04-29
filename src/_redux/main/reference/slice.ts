import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  htmlElementsReferences,
  TFilesReference,
  filesReferences,
  THtmlElementsReference,
} from "@rnbws/rfrncs.design";

import {
  TReferenceReducerState,
  TFilesReferenceData,
  THtmlReferenceData,
  THtmlElementsReferenceData,
} from "./types";
// file reference
const _filesReferenceData: TFilesReferenceData = {};
filesReferences.map((fileRef: TFilesReference) => {
  _filesReferenceData[fileRef.Extension] = fileRef;
});

//html reference
const _htmlElementsReferenceData: THtmlElementsReferenceData = {};
htmlElementsReferences.map((htmlRefElement: THtmlElementsReference) => {
  const pureTag =
    htmlRefElement["Name"] === "Comment"
      ? "comment"
      : htmlRefElement["Tag"]?.slice(1, htmlRefElement["Tag"].length - 1);
  _htmlElementsReferenceData[pureTag] = htmlRefElement;
});

const referenceReducerInitialState: TReferenceReducerState = {
  filesReferenceData: _filesReferenceData,
  htmlReferenceData: { elements: _htmlElementsReferenceData },
  isContentProgrammaticallyChanged: false,
  isCodeTyping: false,
};
const referenceSlice = createSlice({
  name: "reference",
  initialState: referenceReducerInitialState,
  reducers: {
    setFilesReferenceData(state, action: PayloadAction<TFilesReferenceData>) {
      const filesReferenceData = action.payload;
      state.filesReferenceData = filesReferenceData;
    },
    setHtmlReferenceData(state, action: PayloadAction<THtmlReferenceData>) {
      const htmlReferenceData = action.payload;
      state.htmlReferenceData = htmlReferenceData;
    },
    setIsContentProgrammaticallyChanged(state, action: PayloadAction<boolean>) {
      const isContentProgrammaticallyChanged = action.payload;
      state.isContentProgrammaticallyChanged = isContentProgrammaticallyChanged;
    },
    setIsCodeTyping(state, action: PayloadAction<boolean>) {
      const isCodeTyping = action.payload;
      state.isCodeTyping = isCodeTyping;
    },
  },
});
export const {
  setFilesReferenceData,
  setHtmlReferenceData,
  setIsContentProgrammaticallyChanged,
  setIsCodeTyping,
} = referenceSlice.actions;
export const ReferenceReducer = referenceSlice.reducer;
