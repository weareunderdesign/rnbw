import React from 'react';

import {
  ActionsPanel,
  CodeView,
  StageView,
} from '@_components/main';

import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  return (<>
    <div style={{
      width: "calc(100% - 4rem)",
      height: "calc(100% - 4rem)",

      margin: "2rem",

      background: "rgb(36, 41, 46)",
      boxShadow: "1px 1px 5px 1px rgb(20, 20, 20)",

      display: "flex",
    }}>
      <ActionsPanel />
      <StageView />
      <CodeView />
    </div>
  </>)
}