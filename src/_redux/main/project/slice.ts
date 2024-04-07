import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  TFileHandlerCollection,
  TProjectReducerState,
  TRecentProjects,
} from "./types";

const projectReducerInitialState: TProjectReducerState = {
  projectHandlers: {},
  currentProjectFileHandle: null,
  fileHandlers: {},
  recentProjects: { names: [], handlers: [], contexts: [] },
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
    setRecentProjects(state, action: PayloadAction<TRecentProjects>) {
      const recentProjects = action.payload;
      state.recentProjects = recentProjects;
    },
  },
});
export const {
  setProjectHandlers,
  setCurrentProjectFileHandle,
  setFileHandlers,
  setRecentProjects,
} = projectSlice.actions;
export const ProjectReducer = projectSlice.reducer;
