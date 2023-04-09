import React, { useMemo } from 'react';

import Split from 'react-split';

import NodeTreeView from './nodeTreeView';
import SettingsPanel from './settingsPanel';
import { ActionsPanelProps } from './types';
import WorkspaceTreeView from './workspaceTreeView';

export default function ActionsPanel(props: ActionsPanelProps) {
  return useMemo(() => {
    return <>
      <Split
        style={{ height: '100vh' }}

        sizes={[10, 80, 10]}
        minSize={200}

        expandToMin={true}

        gutterSize={8}

        snapOffset={30}
        dragInterval={1}

        direction="vertical"
        cursor="row-resize"

        onDragEnd={(sizes: Number[]) => {
          console.log('onDragEnd', sizes)
        }}

        elementStyle={(dimension: "height" | "width", elementSize: number, gutterSize: number, index: number) => {
          return {
            'height': 'calc(' + elementSize + '%)',
          }
        }}
        gutterStyle={(dimension: "height" | "width", gutterSize: number, index: number) => {
          return {
            'height': gutterSize + 'px',
          }
        }}
      >
        <WorkspaceTreeView />
        <NodeTreeView />
        <SettingsPanel />
      </Split>
    </>
  }, [])
}