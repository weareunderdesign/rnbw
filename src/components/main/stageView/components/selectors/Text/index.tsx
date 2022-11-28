import { useNode, useEditor, UserComponent } from '@craftjs/core';
import React, { useEffect, useState } from 'react';
import ContentEditable from 'react-contenteditable';

import { TextSettings } from './TextSettings';

export type TextProps = {
  fontSize?: string;
  textAlign?: string;
  fontWeight?: string;
  color?: Record<'r' | 'g' | 'b' | 'a', string>;
  shadow?: number;
  text?: string;
  margin?: [string, string, string, string];
};

export const Text: UserComponent<TextProps> = ({
  fontSize,
  textAlign,
  fontWeight,
  color,
  shadow,
  text,
  margin,
}: Partial<TextProps>) => {
  const { connectors: { connect, drag }, hasSelectedNode, isActive, actions: { setProp } } = useNode((state) => ({
    hasSelectedNode: state.events.selected,
    isActive: state.events.selected
  }));

  const [editable, setEditable] = useState(false);

  useEffect(() => { !hasSelectedNode && setEditable(false) }, [hasSelectedNode]);

  return (
    <div ref={ref => connect(drag(ref as HTMLElement))} >
      <ContentEditable
        innerRef={connect}
        /*@ts-ignore */
        html={text} // innerHTML of the editable div
        disabled={!editable}
        onChange={(e) => {
          setProp((prop: { text: string; }) => (prop.text = e.target.value), 500);
        }} // use true to disable editing
        tagName="span" // Use a custom HTML tag (uses a div by default)
        style={{
          width: '100%',
          /*@ts-ignore */
          margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
          /*@ts-ignore */
          color: `rgba(${Object.values(color)})`,
          fontSize: `${fontSize}px`,
          textShadow: `0px 0px 2px rgba(0,0,0,${(shadow || 0) / 100})`,
          fontWeight,
          textAlign,
        }}
      />
    </div>
  );
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
    toolbar: TextSettings,
  },
};
