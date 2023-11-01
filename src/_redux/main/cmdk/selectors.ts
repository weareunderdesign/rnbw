import { AppState } from "@_redux/_root";
import { createSelector } from "@reduxjs/toolkit";

import { TCommand } from "./types";

const getCmdkOpen = (state: AppState): boolean => state.main.cmdk.cmdkOpen;
export const cmdkOpenSelector = createSelector(
  getCmdkOpen,
  (cmdkOpen) => cmdkOpen,
);

const getCmdkPages = (state: AppState): string[] => state.main.cmdk.cmdkPages;
export const cmdkPagesSelector = createSelector(
  getCmdkPages,
  (cmdkPages) => cmdkPages,
);

const getCurrentCmdkPage = (state: AppState): string | null =>
  state.main.cmdk.currentCmdkPage;
export const currentCmdkPageSelector = createSelector(
  getCurrentCmdkPage,
  (currentCmdkPage) => currentCmdkPage,
);

const getCurrentCommand = (state: AppState): TCommand | null =>
  state.main.cmdk.currentCommand;
export const currentCommandSelector = createSelector(
  getCurrentCommand,
  (currentCommand) => currentCommand,
);
