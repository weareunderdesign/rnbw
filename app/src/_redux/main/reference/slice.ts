import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  TReferenceReducerState,
  TFilesReferenceData,
  THtmlElementsReferenceData,
  TFilesReference,
  THtmlElementsReference,
} from "./types";
import { filesReferences, htmlElementsReferences } from "./rfrncs";
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
export const { setIsContentProgrammaticallyChanged, setIsCodeTyping } =
  referenceSlice.actions;
export const ReferenceReducer = referenceSlice.reducer;
