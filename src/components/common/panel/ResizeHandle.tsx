import React, {
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import cx from 'classnames';
import { PanelResizeHandle } from 'react-resizable-panels';

import { MainContext } from '@_redux/main';

import { ResizeHandleProps } from './types';

export const ResizeHandle = (props: ResizeHandleProps) => {
  const { setPanelResizing } = useContext(MainContext)
  const onMouseDown = () => {
    setPanelResizing(true)
  }
  const onMouseUp = () => {
    setPanelResizing(false)
  }

  const [hover, setHover] = useState(false)
  const onMouseEnter = useCallback(() => {
    setHover(true)
  }, [])
  const onMouseLeave = useCallback(() => {
    setHover(false)
  }, [])

  const containerStyle = useMemo(() => ({
    width: props.direction === 'horizontal' ? '1px' : '',
    height: props.direction === 'vertical' ? '1px' : '',

    zIndex: '1',
  }), [hover, props.direction])

  const handlerStyle = useMemo(() => ({
    width: props.direction === 'vertical' ? '100%' : '10px',
    height: props.direction === 'horizontal' ? '100%' : '10px',

    marginLeft: props.direction === 'horizontal' ? '-4px' : '',
    marginTop: props.direction === 'vertical' ? '-4px' : '',

    background: 'transparent',
  }), [props.direction])

  return <>
    <div
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}

      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}

      style={containerStyle}
      className={cx(
        'transition-linear',
        hover ? 'background-tertiary' : 'background-secondary',
      )}
    >
      <PanelResizeHandle style={handlerStyle} />
    </div>
  </>
}