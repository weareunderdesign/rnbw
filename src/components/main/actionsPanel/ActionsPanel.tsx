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
  const [actionsPanelPanelSizes, setActionsPanelPanelSizes] = useState<number[]>([10, 90, 0])
  useEffect(() => {
    const sizes = localStorage.getItem('actions-panel-panel-sizes')
    sizes && setActionsPanelPanelSizes(JSON.parse(sizes))
  }, [])

  return useMemo(() => {
    return <>
      <Split
        id='ActionsPanel'
        style={{ height: '100vh' }}

        sizes={actionsPanelPanelSizes}
        minSize={[200, 200, 0]}
        maxSize={[Infinity, Infinity, 0]}

        expandToMin={true}

        gutterSize={8}

        snapOffset={30}
        dragInterval={1}

        direction="vertical"
        cursor="row-resize"

        onDragEnd={(sizes: number[]) => {
          setActionsPanelPanelSizes(sizes)
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

        collapsed={2}
      >
        <WorkspaceTreeView />
        <NodeTreeView />
        <SettingsPanel />
      </Split>
    </>
  }, [actionsPanelPanelSizes])
}