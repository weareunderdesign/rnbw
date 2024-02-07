import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

import IFrame from "./iFrame";
import { StageViewProps } from "./types";
import { setActivePanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

export default function StageView(props: StageViewProps) {
  const dispatch = useDispatch();
  const onClick = useCallback(() => {
    dispatch(setActivePanel("stage"));
  }, []);
  const { showCodeView } = useAppState();
  return useMemo(() => {
    return (
      <>
        <div
          id="StageView"
          className={showCodeView ? "" : "view"}
          onClick={onClick}
          style={{ height: "100%" }}
        >
          <IFrame />
        </div>
      </>
    );
  }, []);
}
