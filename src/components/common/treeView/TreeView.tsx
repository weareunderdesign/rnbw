import 'react-complex-tree/lib/style.css';

import React from 'react';

import {
  StaticTreeDataProvider,
  Tree,
  UncontrolledTreeEnvironment,
} from 'react-complex-tree';

import styles from './TreeView.module.scss';

// test data
const items = {
  root: {
    index: 'root',
    canMove: true,
    isFolder: true,
    children: ['child1', 'child2'],
    data: 'Root item',
    canRename: true,
  },
  child1: {
    index: 'child1',
    canMove: true,
    isFolder: false,
    children: JSON.parse(JSON.stringify([])),
    data: 'Child item 1',
    canRename: true,
  },
  child2: {
    index: 'child2',
    canMove: true,
    isFolder: false,
    children: JSON.parse(JSON.stringify([])),
    data: 'Child item 2',
    canRename: true,
  },
};

export default function TreeView() {
  return (<div className={styles.TreeView}>
    <UncontrolledTreeEnvironment
      dataProvider={new StaticTreeDataProvider(items, (item, data) => ({ ...item, data }))}
      getItemTitle={item => item.data}
      viewState={{}}
    >
      <Tree treeId="tree-1" rootItem="root" treeLabel="Tree Example" />
    </UncontrolledTreeEnvironment>
  </div>)
}