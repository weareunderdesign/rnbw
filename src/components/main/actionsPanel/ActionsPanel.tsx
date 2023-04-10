import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Split from 'react-split';

import NodeTreeView from './nodeTreeView';
import SettingsPanel from './settingsPanel';
import { ActionsPanelProps } from './types';
import WorkspaceTreeView from './workspaceTreeView';

export default function ActionsPanel(props: ActionsPanelProps) {
  // -------------------------------------------------------------- resizable panels --------------------------------------------------------------
  const [panelSizes, setPanelSizes] = useState<number[]>([10, 80, 10])
  useEffect(() => {
    const sizes = localStorage.getItem('actions-panel-panel-sizes')
    sizes && setPanelSizes(JSON.parse(sizes))
  }, [])

  return useMemo(() => {
    return <>
      <Split
        id='ActionsPanel'
        style={{ height: '100vh' }}

        sizes={panelSizes}
        minSize={200}

        expandToMin={true}

        gutterSize={8}

        snapOffset={30}
        dragInterval={1}

        direction="vertical"
        cursor="row-resize"

        onDragEnd={(sizes: number[]) => {
          setPanelSizes(sizes)
          localStorage.setItem('actions-panel-panel-sizes', JSON.stringify(sizes))
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