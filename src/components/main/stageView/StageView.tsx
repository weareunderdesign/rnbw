import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

import IFrame from "./iFrame";
import { StageViewProps } from "./types";
import { setActivePanel } from "@_redux/main/processor";

export default function StageView(props: StageViewProps) {
  const dispatch = useDispatch();
  const onClick = useCallback(() => {
    dispatch(setActivePanel("stage"));
  }, []);

  return useMemo(() => {
    return (
      <>
        <div id="StageView" className="view" onClick={onClick}>
          <IFrame />
        </div>
      </>
    );
  }, []);
}
