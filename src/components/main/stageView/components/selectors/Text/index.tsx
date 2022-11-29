import { useNode, useEditor, UserComponent, QueryMethods } from '@craftjs/core';
import React, { useEffect, useState } from 'react';
import ContentEditable from 'react-contenteditable';

// import { TextSettings } from './TextSettings';

export type TextProps = {
  fontSize?: string;
  textAlign?: string;
  fontWeight?: string;
  color?: Record<'r' | 'g' | 'b' | 'a', string>;
  shadow?: number;
  text?: string;
  margin?: [string, string, string, string];
};


const TextSettings = () => {
  /* @ts-ignore */
  const { props, setProp } = useNode();
  return (
    <div>
      Text: <input type="text" value={props.text} onChange={e => setProp(props => props.text = e.target.value)} />
      Color: <input type="text" value={props.color} onChange={e => setProp(props => props.color = e.target.value)} />
    </div>
  )
}


export const Text: UserComponent<TextProps> = ({ text }: Partial<TextProps>) => {

  const { connectors: { connect, drag }, hasSelectedNode, actions: { setProp } } = useNode((state) => ({
    hasSelectedNode: state.events.selected,
  }));

  
  const [editable, setEditable] = useState(false);

  useEffect(() => {
    setEditable(hasSelectedNode);
  }, [hasSelectedNode]);
  return (
    editable ? <>
      <input type="text" value={text} onChange={e => {
        setProp((props: any) => {
          props.children = e.target.value;
        }, 500);
      }} onBlur={(e) => {
        console.log(e)
        
        setEditable(false)
      }}/>
    </>
      : <div>{text}</div>
  )
};

Text.craft = {
  displayName: 'Text',
  props: {
    fontSize: '15',
    textAlign: 'left',
    fontWeight: '500',
    color: { r: "92", g: "90", b: "90", a: "1" },
    margin: ["0", "0", "0", "0"],
    shadow: 0,
    text: 'Text',
  },
  rules: {
    // /*@ts-ignore*/
    canDrag: (node) => node.data.props.text !== "Drag"
  },
  related: {
    settings: TextSettings
  },
};
