import React from 'react';

import { SettingsPanelProps } from './types';
import "./SettingsPanel.css"

export default function SettingsPanel(props: SettingsPanelProps) {
  return <>
    <div style={{
      width: "100%",
      height: "calc(100% - 800px)",
      overflow: "auto",
      borderBottom: "1px solid rgb(10, 10, 10)",
    }}>
      <div
        style={{
          zIndex: "1",
          position: "sticky",
          top: "0",
          width: "100%",
          color: "white",
          fontSize: "13px",
          padding: "2px 0px 5px 5px",
          marginBottom: "5px",
          borderBottom: "1px solid black",
          background: "rgb(31, 36, 40)"
        }}
      >
        Settings
      </div>
      <div style={{
        color: "white",
      }}>
        <div className="row">
          <label className="col-md-4" >font-size:</label>
          <input className="col-md-8" type="text"/>
        </div>
        <div className="row">
          <label className="col-md-4">Padding:</label>
          <input className="col-md-8" type="text"/>
        </div>

      </div>
    </div>

  </>
}