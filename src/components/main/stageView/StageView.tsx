import React, {
  useCallback,
  useContext,
  useMemo,
} from 'react';

import cx from 'classnames';
import { Panel } from 'react-resizable-panels';

import { MainContext } from '@_redux/main';

import IFrame from './iFrame';
import { StageViewProps } from './types';

export default function StageView(props: StageViewProps) {
  const { iframeSrc, panelResizing, setActivePanel } = useContext(MainContext)

  const onPanelClick = useCallback(() => {
    setActivePanel('stage')
  }, [])

  return useMemo(() => {
    return <>
      <Panel minSize={0}>
        <div
          id="StageView"
          className={cx(
            'scrollable',
          )}
          style={{
            background: iframeSrc ? "white" : "",
            position: "relative",
            pointerEvents: panelResizing ? 'none' : 'auto',
          }}
          onClick={onPanelClick}
        >
          <IFrame />
        </div>
      </Panel>
    </>
  }, [iframeSrc, panelResizing, onPanelClick])
}