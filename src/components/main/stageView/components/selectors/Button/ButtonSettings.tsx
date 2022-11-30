import { useNode } from '@craftjs/core';
import React, { ReactElement, useState } from 'react';
import { useMemo } from 'react';
import { useEffect } from 'react';

type StyleProperty = {
  name: string,
  value: string,
}

export const ButtonSettings = () => {
  /* @ts-ignore */
  const {
    actions: { setProp },
    style,
    dom
  } = useNode((node) => ({
    style: node.data.props.style,
    dom: node.dom
  }));
  const styleLists: Record<string, StyleProperty> = useMemo(() => {
    let elements: Record<string, StyleProperty> = {};
    
    const defaultStyles = ["margin", "padding"];
    defaultStyles.map((name) => {
      elements[name] = {
        name,
        value: "",
      };
    });

    if (style == undefined) {
      return elements;
    }
    Object.keys(style).map((name) => {
      elements[name] = {
        name: name,
        value: style[name],
      };
    })
    return elements

  }, [dom, style])

  return (
    <div className="direction-row">
      {
        Object.keys(styleLists).map( (key) => {
          const styleItem = styleLists[key]
          return <div key={'attr_' + styleItem.name}>
            <label style={{ color: "white" }}>{styleItem.name}:</label>
            <input type="text" value={styleItem.value} onChange={
              (e) => {
                setProp((props: any) => {
                  if (props.style == undefined)
                    props.style = {};
                  props.style[styleItem.name] = e.target.value;
                });
                dom?.style.setProperty(styleItem.name, e.target.value)
              }
            }></input>
          </div>
        })
      }
    </div>
  );
}
