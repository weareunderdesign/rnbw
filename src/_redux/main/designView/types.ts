export type TDesignViewReducerState = {
  iframeSrc: string | null;
  iframeLoading: boolean;
  linkToOpen: string | null;
  syncConfigs: DesignViewSyncConfigs;
};

export type DesignViewSyncConfigs = {
  matchIds?: string[] | null;
  skipFromChildren?: boolean;
};
