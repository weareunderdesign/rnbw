import React from 'react';

import NodeTreeView from './nodeTreeView';
import SettingsPanel from './settingsPanel';
import { ActionsPanelProps } from './types';
import WorkspaceTreeView from './workspaceTreeView';

export default function ActionsPanel(props: ActionsPanelProps) {
  return <>
    <div className='panel justify-stretch'>
      <WorkspaceTreeView />
      <NodeTreeView />
      <SettingsPanel />
    </div>
  </>
}