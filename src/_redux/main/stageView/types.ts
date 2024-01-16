export type TStageViewReducerState = {
  iframeSrc: string | null;
  iframeLoading: boolean;
  needToReloadIframe: boolean;
  linkToOpen: string | null;
  webComponentOpen: boolean;
  syncConfigs: StageViewSyncConfigs;
};

export type StageViewSyncConfigs = {
  matchIds?: string[] | null;
  skipFromChildren?: boolean;
};
