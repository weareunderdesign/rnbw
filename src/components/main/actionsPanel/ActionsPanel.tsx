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
    <Panel className='panel' defaultSize={10}>
      <PanelGroup direction="vertical">
        <WorkspaceTreeView />

        <PanelResizeHandle className='panel-resize-handler height-xs' />

        <NodeTreeView />

        <PanelResizeHandle className='panel-resize-handler height-xs' />

        <SettingsPanel />
      </PanelGroup>
    </Panel>
  </>
}