import React, { useState } from 'react';

import {
  useNode,
  UserComponent,
} from '@craftjs/core';

import { TextProps } from './types';

const Text: UserComponent<TextProps> = ({ text }: Partial<TextProps>) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp }
  } = useNode((state) => ({
    selected: state.events.selected,
  }))

  const [editable, setEditable] = useState(false)

  return (
    editable ? <>
      <input
        type="text"
        value={text}
        onChange={e => {
          setProp((props: any) => {
            props.children = e.target.value
          }, 500)
        }}
        onBlur={(e) => {
          setEditable(false)
        }} 
        />
    </>
      : <div onDoubleClick={(e) => setEditable(true)}>{text}</div>
  )
}

export default Text