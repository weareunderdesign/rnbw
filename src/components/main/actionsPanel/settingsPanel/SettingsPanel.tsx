import './SettingsPanel.css';

import React from 'react';

import { useEditor } from '@craftjs/core';

import { SettingsPanelProps } from './types';

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
    <div className="panel">
      <div className="border-bottom" style={{ height: "200px", overflow: "auto" }}>
        {/* Nav Bar */}
        <div className="sticky direction-column padding-s box-l justify-stretch border-bottom background-primary">
          <div className="gap-s box justify-start">
            {/* label */}
            <span className="text-s">Settings</span>
          </div>
          <div className="gap-s justify-end box">
            {/* action button */}
            {/* <div className="icon-add opacity-m icon-xs" onClick={() => { }}></div> */}
          </div>
        </div>
      </div>

      {selected && selected.settings && React.createElement(selected.settings)}
    </div>
  </>
}