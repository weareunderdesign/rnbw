import React, {
  useCallback,
  useContext,
  useMemo,
} from 'react';

import cx from 'classnames';

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
      <div
        id="StageView"
        className={cx(
          'scrollable',
        )}
        style={{
          height: "100vh",
          background: iframeSrc ? "white" : "",
          position: "relative",
          pointerEvents: panelResizing ? 'none' : 'auto',
        }}
        onClick={onPanelClick}
      >
        <IFrame />
      </div>
    </>
  }, [iframeSrc, panelResizing, onPanelClick])
}