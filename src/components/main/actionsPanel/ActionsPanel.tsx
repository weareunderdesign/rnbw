import React from 'react';

import NodeTreeView from './nodeTreeView';
import SettingsPanel from './settingsPanel';
import { ActionsPanelProps } from './types';
import WorkspaceTreeView from './workspaceTreeView';

export default function ActionsPanel(props: ActionsPanelProps) {
  return <>
    <div className='panel background-primary border-top border-right border-bottom border-left' style={{ width: "300px", height: "100%" }}>
      <WorkspaceTreeView />
      <NodeTreeView />
      <SettingsPanel />
    </div>
  </>
}