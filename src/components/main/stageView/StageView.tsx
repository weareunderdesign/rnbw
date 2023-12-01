import React, { useCallback, useMemo } from "react";

import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";

import IFrame from "./iFrame";
import { StageViewProps } from "./types";

export default function StageView(props: StageViewProps) {
  const dispatch = useDispatch();

  const onPanelClick = useCallback(() => {
    dispatch(setActivePanel("stage"));
  }, []);

  return useMemo(() => {
    return (
      <>
        <div id="StageView" className="view" onClick={onPanelClick}>
          <IFrame />
        </div>
      </>
    );
  }, [onPanelClick]);
}
