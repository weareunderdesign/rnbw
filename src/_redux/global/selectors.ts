import { AppState } from "@_redux/_root";
import { createSelector } from "@reduxjs/toolkit";

import { TOsType, TTheme } from "./types";

const getOsType = (state: AppState): TOsType => state.global.osType;
export const osTypeSelector = createSelector(getOsType, (osType) => osType);

const getTheme = (state: AppState): TTheme => state.global.theme;
export const themeSelector = createSelector(getTheme, (theme) => theme);
