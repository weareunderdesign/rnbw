import React from 'react';

import NodeTreeView from './nodeTreeView';
import SettingsPanel from './settingsPanel';
import { ActionsPanelProps } from './types';
import WorkspaceTreeView from './workspaceTreeView';

export default function ActionsPanel(props: ActionsPanelProps) {
  return (<>
    <div style={{
      width: "400px",
      height: "100%",

      background: "rgb(31, 36, 40)",
      border: "1px solid rgb(30, 30, 30)",
    }}>
      <WorkspaceTreeView />
      <NodeTreeView />
      <SettingsPanel />
    </div>
  </>)
}