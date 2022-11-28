import React from 'react';

import { useDispatch } from 'react-redux';
import { ActionCreators } from 'redux-undo';

import { HmsModuleProps } from './types';

export default function HmsModule(props: HmsModuleProps) {
  const dispatch = useDispatch()

  /* methods */
  const cmdz = () => {
    dispatch(ActionCreators.undo())
  }
  const cmdy = () => {
    dispatch(ActionCreators.redo())
  }

  return <>
    <div
      style={{
        position: "absolute",
        zIndex: "99",
        bottom: "2rem",
        right: "2rem",
      }}
    >
      {/* cmdz button */}
      <button
        style={{
          background: "rgb(23 111 44)",
          color: "white",
          border: "none",
          font: "normal lighter normal 12px Arial",
          margin: "0px 5px",
        }}
        onClick={cmdz}
      >
        {`<-`}
      </button>

      {/* cmdy button */}
      <button
        style={{
          background: "rgb(23 111 44)",
          color: "white",
          border: "none",
          font: "normal lighter normal 12px Arial",
          margin: "0px 5px",
        }}
        onClick={cmdy}
      >
        {`->`}
      </button>
    </div>
  </>
}