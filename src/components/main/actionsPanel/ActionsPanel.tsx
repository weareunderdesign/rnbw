import React, {
  useEffect,
  useState,
} from 'react';

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
  // panel size handler
  const [panelSize, setPanelSize] = useState(240 / window.innerWidth * 100)
  useEffect(() => {
    const windowResizeHandler = () => {
      setPanelSize(200 / window.innerWidth * 100)
    }
    window.addEventListener('resize', windowResizeHandler)

    return () => window.removeEventListener('resize', windowResizeHandler)
  }, [])

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
}