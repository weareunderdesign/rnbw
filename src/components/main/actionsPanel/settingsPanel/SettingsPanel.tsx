import React, { useMemo, useState } from 'react';

import { SettingsPanelProps } from './types';
import "./SettingsPanel.css"
import { useEditor, useNode } from '@craftjs/core';
import { useEffect } from 'react';
import { serializeFile, updateNode } from '@_node/apis';
import { useDispatch, useSelector } from 'react-redux';
import { globalGetCurrentFileSelector, globalGetNodeTreeSelector, updateFileContent } from '@_redux/main';
import { TTree } from '@_node/types';

type StyleProperty = {
  name: string,
  value: string,
}

export default function SettingsPanel(props: SettingsPanelProps) {
  const { actions, selected, isEnabled } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last();
    let selected;
    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        style: state.nodes[currentNodeId].data.props.style,
        props: state.nodes[currentNodeId].data.props,
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }
    return {
      selected,
      isEnabled: state.options.enabled,
    };
  });


  const [styleLists, setStyleLists] = useState<Record<string, StyleProperty>>({})
  const nodetree = useSelector(globalGetNodeTreeSelector)
  const dispatch = useDispatch()
  const { type } = useSelector(globalGetCurrentFileSelector)

  useEffect(() => {

    let elements: Record<string, StyleProperty> = {};
    const defaultStyles = ["margin", "padding"];

    defaultStyles.map((name) => {
      elements[name] = {
        name,
        value: "",
      };
    });

    if (selected !== undefined && selected.style !== undefined) {

      Object.keys(selected.style).map((name) => {
        elements[name] = {
          name: name,
          value: selected.style[name],
        };
      })
    }
    setStyleLists(elements)
  }, [selected])

  const convertStyle = (styleList: Record<string, StyleProperty>) => {
    const result: Object = {}
    Object.keys(styleList).map((key) => {
      const styleItem = styleList[key]
      /*@ts-ignore*/
      result[styleItem.name] = styleItem.value
    })
    return result
  }

  /* update the global state */
  const updateFFContent = async (tree: TTree) => {
    console.log("update content")
    const content = serializeFile({ type, tree })
    dispatch(updateFileContent(content))
  }
  return <>
    <div style={{
      width: "100%",
      height: "calc(100% - 600px)",
      overflow: "auto",
      borderBottom: "1px solid rgb(10, 10, 10)",
    }}>
      <div
        style={{
          zIndex: "1",
          position: "sticky",
          top: "0",
          width: "100%",
          color: "white",
          fontSize: "13px",
          padding: "2px 0px 5px 5px",
          marginBottom: "5px",
          borderBottom: "1px solid black",
          background: "rgb(31, 36, 40)"
        }}
      >
        Settings
      </div>
      <div className="direction-row">
        {
          selected && Object.keys(styleLists).map((key) => {
            const styleItem = styleLists[key]
            return <div key={'attr_' + styleItem.name}>
              <label >{styleItem.name}:</label>
              <input type="text" value={styleItem.value} onChange={
                (e) => {
                  const newStyleList = JSON.parse(JSON.stringify(styleLists))
                  newStyleList[key].value = e.target.value;
                  setStyleLists(newStyleList)
                  // props changed
                  if (selected) {
                    const tree = JSON.parse(JSON.stringify(nodetree))
                    const result = updateNode({
                      tree: tree,
                      data: {
                        ...selected.props,
                        style: convertStyle(newStyleList),
                      },
                      uid: selected.id
                    })
                    if (result.success == true) {
                      updateFFContent(tree)
                    }
                  }
                }
              }></input>
            </div>
          })
        }
      </div>
    </div>

  </>
}