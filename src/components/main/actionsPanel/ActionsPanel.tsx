import React from 'react';

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';

import NodeTreeView from './nodeTreeView';
import SettingsPanel from './settingsPanel';
import { ActionsPanelProps } from './types';
import WorkspaceTreeView from './workspaceTreeView';

export default function ActionsPanel(props: ActionsPanelProps) {
  return <>
    <Panel defaultSize={20}>
      <PanelGroup direction="vertical">
        <WorkspaceTreeView />

        <PanelResizeHandle style={{ height: "1px" }} className='background-secondary transition-linear' />

        <NodeTreeView />

        <PanelResizeHandle style={{ width: "1px" }} className='background-secondary transition-linear' />

        <SettingsPanel />
      </PanelGroup>
    </Panel>
  </>
}