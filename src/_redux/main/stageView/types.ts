export type TStageViewReducerState = {
  iframeSrc: string | null;
  iframeLoading: boolean;
  linkToOpen: string | null;
  syncConfigs: StageViewSyncConfigs;
};

export type StageViewSyncConfigs = {
  matchIds?: string[] | null;
  skipFromChildren?: boolean;
};
