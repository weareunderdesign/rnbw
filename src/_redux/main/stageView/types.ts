export type TStageViewReducerState = {
  iframeSrc: string | null;
  iframeLoading: boolean;
  needToReloadIframe: boolean;
  linkToOpen: string | null;
  webComponentOpen: boolean;
  syncConfigs: StageViewSyncConfigs;
  contentEditable: boolean;
};

export type StageViewSyncConfigs = {
  matchIds?: string[] | null;
  skipFromChildren?: boolean;
};
