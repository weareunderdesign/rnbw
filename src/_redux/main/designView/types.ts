export type TDesignViewReducerState = {
  iframeSrc: string | null;
  iframeLoading: boolean;
  linkToOpen: string | null;
  syncConfigs: DesignViewSyncConfigs;
  reloadIframe: boolean,
  setReloadIframe: boolean;
};

export type DesignViewSyncConfigs = {
  matchIds?: string[] | null;
  skipFromChildren?: boolean;
};
