import React from 'react';

import { SettingsPanelProps } from './types';
import "./SettingsPanel.css"
import { useEditor, useNode } from '@craftjs/core';
import { useEffect } from 'react';

export default function SettingsPanel(props: SettingsPanelProps) {
  const { actions, selected, isEnabled } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last();
    let selected;
    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings:
          state.nodes[currentNodeId].related &&
          state.nodes[currentNodeId].related.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }
    return {
      selected,
      isEnabled: state.options.enabled,
    };
  });

  return <>
    <div style={{
      width: "100%",
      height: "calc(100% - 600px)",
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
      {selected && selected.settings && React.createElement(selected.settings)}
    </div>

  </>
}