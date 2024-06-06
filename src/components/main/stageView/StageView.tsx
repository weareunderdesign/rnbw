import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

import IFrame from "./iFrame";

import { setActivePanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import PanAndPinch from "@_components/canvas/PanAndPinch";
// import { Rnd } from "react-rnd";

export default function StageView() {
  const { showCodeView, activePanel } = useAppState();

  const dispatch = useDispatch();
  const onClick = useCallback(() => {
    activePanel !== "stage" && dispatch(setActivePanel("stage"));
  }, [activePanel]);
  return useMemo(() => {
    return (
      <>
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PanAndPinch>
            <div
              id="StageView"
              className={showCodeView ? "" : "view"}
              onClick={onClick}
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* <Rnd
              default={{
                x: 150,
                y: 205,
                width: 500,
                height: 190,
              }}
              minWidth={500}
              minHeight={190}
              dragAxis="both"
              style={{ zIndex: "100000000" }}
              bounds="window"
            > */}
              {/* <div style={{ background: "white", width: "100%", height: "100%" }}>
              XXXXXXXX
            </div> */}
              <IFrame />
              {/* </Rnd> */}
            </div>
          </PanAndPinch>
        </div>
      </>
    );
  }, []);
}
