import React, {
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

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
    boxShadow: props.direction === 'horizontal' ?
      !hover ? 'var(--color-secondary-background) 1px 0px 0px 0px inset' : 'var(--color-tertiary-background) 2px 0px 0px 0px inset' :
      !hover ? 'var(--color-secondary-background) 0px 1px 0px 0px inset' : 'var(--color-tertiary-background) 0px 2px 0px 0px inset',

    width: props.direction === 'horizontal' ?
      !hover ? '1px' : '2px' :
      '',
    height: props.direction === 'vertical' ?
      !hover ? '1px' : '2px' :
      '',

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
      className={'transition-linear'}
    >
      <PanelResizeHandle style={handlerStyle} />
    </div>
  </>
}