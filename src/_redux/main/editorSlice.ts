import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as monaco from "monaco-editor";
import { enableMapSet } from "immer";

enableMapSet();

interface EditorState {
  editorInstance: monaco.editor.IStandaloneCodeEditor | null;
  isEditorReady: boolean;
  editorInstancesMap: Map<string, monaco.editor.IStandaloneCodeEditor>;
}

const initialState: EditorState = {
  editorInstance: null,
  isEditorReady: false,
  editorInstancesMap: new Map(),
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
    setEditorInstancesMap(
      state,
      action: PayloadAction<Map<string, monaco.editor.IStandaloneCodeEditor>>,
    ) {
      state.editorInstancesMap = action.payload;
    },
    addEditorInstanceToMap(
      state,
      action: PayloadAction<[string, monaco.editor.IStandaloneCodeEditor]>,
    ) {
      state.editorInstancesMap.set(action.payload[0], action.payload[1]);
    },
  },
});

export const {
  setEditorInstance,
  setEditorInstancesMap,
  addEditorInstanceToMap,
} = editorSlice.actions;
export default editorSlice.reducer;
