import React from 'react';

import {
  ActionsPanel,
  CodeView,
  StageView,
} from '@components/main';

import styles from './MainPage.module.scss';

export default function MainPage() {
  return (<>
    <div className={styles.MainPage}>
      <ActionsPanel />
      <StageView />
      <CodeView />
    </div>
  </>)
}