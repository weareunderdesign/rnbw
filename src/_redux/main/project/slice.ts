import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  TFileHandlerCollection,
  TProjectReducerState,
  TRecentProject,
} from "./types";

const projectReducerInitialState: TProjectReducerState = {
  projectHandlers: {},
  currentProjectFileHandle: null,
  fileHandlers: {},
  recentProject: [],
};
const projectSlice = createSlice({
  name: "project",
  initialState: projectReducerInitialState,
  reducers: {
    setProjectHandlers(state, action: PayloadAction<TFileHandlerCollection>) {
      const projectHandlers = action.payload;
      state.projectHandlers = projectHandlers;
    },
    setCurrentProjectFileHandle(
      state,
      action: PayloadAction<FileSystemDirectoryHandle | null>,
    ) {
      const currentProjectFileHandle = action.payload;
      state.currentProjectFileHandle = currentProjectFileHandle;
    },
    setFileHandlers(state, action: PayloadAction<TFileHandlerCollection>) {
      const fileHandlers = action.payload;
      state.fileHandlers = fileHandlers;
    },
    setRecentProject(state, action: PayloadAction<TRecentProject[]>) {
      const recentProject = action.payload;
      state.recentProject = recentProject;
    },
  },
});
export const {
  setProjectHandlers,
  setCurrentProjectFileHandle,
  setFileHandlers,
  setRecentProject,
} = projectSlice.actions;
export const ProjectReducer = projectSlice.reducer;
