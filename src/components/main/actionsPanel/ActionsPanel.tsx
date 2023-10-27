import React, { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { showActionsPanelSelector } from '@_redux/main/processor';

import NavigatorPanel from './navigatorPanel';
import NodeTreeView from './nodeTreeView';
import SettingsPanel from './settingsPanel';
import { ActionsPanelProps } from './types';
import WorkspaceTreeView from './workspaceTreeView';

export default function ActionsPanel(props: ActionsPanelProps) {
  const showActionsPanel = useSelector(showActionsPanelSelector);

  return useMemo(() => {
    return (
      <div
        id="ActionsPanel"
        className="border radius-s background-primary shadow"
        style={{
          position: "absolute",
          ...props,
          overflow: "hidden",
          ...(showActionsPanel ? {} : { width: "0", border: "none" }),
        }}
      >
        <NavigatorPanel />
        <WorkspaceTreeView />
        <NodeTreeView />
        {false && <SettingsPanel />}
      </div>
    );
  }, [props, showActionsPanel]);
}
