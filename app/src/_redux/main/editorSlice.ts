import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as monaco from "monaco-editor";
import { enableMapSet } from "immer";

enableMapSet();

interface EditorState {
  editorInstance: monaco.editor.IStandaloneCodeEditor | null;
  isEditorReady: boolean;
}

const initialState: EditorState = {
  editorInstance: null,
  isEditorReady: false,
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    setEditorInstance(
      state,
      action: PayloadAction<monaco.editor.IStandaloneCodeEditor>,
    ) {
      state.editorInstance = action.payload;
      state.isEditorReady = true;
    },
  },
});

export const { setEditorInstance } = editorSlice.actions;
export default editorSlice.reducer;
