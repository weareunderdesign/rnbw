import { createSelector } from 'reselect';

import { AppState } from '@redux/_root';

// workspace selector
const globalGetWorkspace = (state: AppState) => state.global.workspace
export const globalGetWorkspaceSelector = createSelector(globalGetWorkspace, (workspace) => workspace)

// project selector
const globalGetProjects = (state: AppState) => state.global.projects
export const globalGetProjectsSelector = createSelector(globalGetProjects, (projects) => projects)

// currentFile selector
const globalGetCurrentFile = (state: AppState) => state.global.currentFile
export const globalGetCurrentFileSelector = createSelector(globalGetCurrentFile, (currentFile) => currentFile)

// globalError selector
const globalGetError = (state: AppState) => state.global.error
export const globalGetErrorSelector = createSelector(globalGetError, (error) => error)