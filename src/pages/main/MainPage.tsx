import React from 'react';

import { TreeView } from '@components/common';

import styles from './MainPage.module.scss';

export default function MainPage() {
  return (<div className={styles.MainPage}>
    <TreeView />
  </div>)
}