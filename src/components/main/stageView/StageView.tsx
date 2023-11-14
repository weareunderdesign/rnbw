import React, { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { AppState } from "@_redux/_root";
import { setActivePanel } from "@_redux/main/processor";

import IFrame from "./iFrame";
import { StageViewProps } from "./types";

export default function StageView(props: StageViewProps) {
  const dispatch = useDispatch();
  const {
    stageView: { iframeSrc },
  } = useSelector((state: AppState) => state.main);

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
  }, [iframeSrc, onPanelClick]);
}
