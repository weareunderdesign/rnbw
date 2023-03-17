import React, { useMemo } from 'react';

import {
  Panel,
  PanelGroup,
} from 'react-resizable-panels';

import { ResizeHandle } from '@_components/common';

import NodeTreeView from './nodeTreeView';
import SettingsPanel from './settingsPanel';
import { ActionsPanelProps } from './types';
import WorkspaceTreeView from './workspaceTreeView';

export default function ActionsPanel(props: ActionsPanelProps) {
  const panelSize = useMemo(() => 240 / window.innerWidth * 100, [])

  return useMemo(() => {
    return <>
      <Panel defaultSize={panelSize} minSize={0}>
        <PanelGroup direction="vertical">
          <WorkspaceTreeView />

          <ResizeHandle direction='vertical'></ResizeHandle>

          <NodeTreeView />

          <ResizeHandle direction='vertical'></ResizeHandle>

          <SettingsPanel />
        </PanelGroup>
      </Panel>
    </>
  }, [panelSize])
}