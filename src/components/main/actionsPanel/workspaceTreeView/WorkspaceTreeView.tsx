import React from 'react';

import { TreeView } from '@components/common';

import styles from './WorkspaceTreeView.module.scss';

export default function WorkspaceTreeView() {
  return (<>
    <div className={styles.WorkspaceTreeView}>
      {/* Name Bar */}
      <div style={{
        zIndex: "1",
        position: "sticky",
        top: "0",
        width: "100%",
        color: "white",
        fontSize: "13px",
        padding: "2px 0px 5px 5px",
        marginBottom: "5px",
        borderBottom: "1px solid black",
        background: "rgb(31, 36, 40)"
      }}> Workspace </div>

      {/* Main TreeView */}
      <TreeView
        width={'300px'}
        height={'400px'}
      />
    </div>
  </>)
}