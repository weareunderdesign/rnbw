import React from 'react';

import styles from './ActionsPanel.module.scss';
import NodeTreeView from './nodeTreeView';
import SettingsPanel from './settingsPanel';
import WorkspaceTreeView from './workspaceTreeView';

export default function ActionsPanel() {
  return (<>
    <div className={styles.ActionsPanel}>
      <WorkspaceTreeView />
      <NodeTreeView />
      <SettingsPanel />
    </div>
  </>)
}