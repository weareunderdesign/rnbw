import React, { useMemo } from "react";

import IFrame from "./iFrame";
import { StageViewProps } from "./types";

export default function StageView(props: StageViewProps) {
  return useMemo(() => {
    return (
      <>
        <div id="StageView" className="view">
          <IFrame />
        </div>
      </>
    );
  }, []);
}
