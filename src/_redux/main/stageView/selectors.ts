import { AppState } from '@_redux/_root';
import { createSelector } from '@reduxjs/toolkit';

const getIframeSrc = (state: AppState): string | null =>
  state.main.stageView.iframeSrc;
export const iframeSrcSelector = createSelector(
  getIframeSrc,
  (iframeSrc) => iframeSrc,
);

const getIframeLoading = (state: AppState): string | null =>
  state.main.stageView.iframeSrc;
export const iframeLoadingSelector = createSelector(
  getIframeLoading,
  (iframeLoading) => iframeLoading,
);

const getNeedToReloadIframe = (state: AppState): boolean =>
  state.main.stageView.needToReloadIframe;
export const needToReloadIframeSelector = createSelector(
  getNeedToReloadIframe,
  (needToReloadIframe) => needToReloadIframe,
);

const getLinkToOpen = (state: AppState): string | null =>
  state.main.stageView.linkToOpen;
export const linkToOpenSelector = createSelector(
  getLinkToOpen,
  (linkToOpen) => linkToOpen,
);
