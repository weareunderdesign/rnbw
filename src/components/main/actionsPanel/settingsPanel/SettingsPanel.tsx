import './SettingsPanel.css';

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  serializeFile,
  updateNode,
} from '@_node/apis';
import { TTree } from '@_node/types';
import * as Main from '@_redux/main';
import { useEditor } from '@craftjs/core';

import { SettingsPanelProps } from './types';

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
  const nodetree = useSelector(Main.globalGetNodeTreeSelector)
  const dispatch = useDispatch()
  const { type } = useSelector(Main.globalGetCurrentFileSelector)

  useEffect(() => {

    let elements: Record<string, StyleProperty> = {};

    // show default styles like margin, padding, etc...
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

  /**
   * It's for saving styles
   * @param styleList 
   * @returns Object { name : value }
   */
  const convertStyle = (styleList: Record<string, StyleProperty>) => {
    const result: Object = {}
    Object.keys(styleList).map((key) => {
      const styleItem = styleList[key]
      /*@ts-ignore*/
      result[styleItem.name] = styleItem.value
    })
    return result
  }

  // update the file content
  const updateFFContent = useCallback(async (tree: TTree) => {
    const content = serializeFile({ type, tree })
    dispatch(Main.updateFileContent(content))
  }, [])
  return <>
    <div className="panel">
      <div className="border-bottom" style={{ height: "200px", overflow: "auto" }}>
        {/* Nav Bar */}
        <div className="sticky direction-column padding-s box-l justify-stretch border-bottom background-primary">
          <div className="gap-s box justify-start">
            {/* label */}
            <span className="text-s">Settings</span>
          </div>
          <div className="gap-s justify-end box">
            {/* action button */}
            {/* <div className="icon-add opacity-m icon-xs" onClick={() => { }}></div> */}
          </div>
        </div>
        {/* panel body */}
        <div className="direction-row">
          {
            selected && Object.keys(styleLists).map((key) => {
              const styleItem = styleLists[key]
              return <div key={'attr_' + styleItem.name}>
                <label >{styleItem.name}:</label>
                <input type="text" value={styleItem.value} onChange={
                  (e) => {
                    // display chages of style properties
                    const newStyleList = JSON.parse(JSON.stringify(styleLists))
                    newStyleList[key].value = e.target.value;
                    setStyleLists(newStyleList)

                    // props changed
                    if (selected) {
                      const tree = JSON.parse(JSON.stringify(nodetree))
                      updateNode({
                        tree: tree,
                        data: {
                          ...selected.props,
                          style: convertStyle(newStyleList),
                        },
                        uid: selected.id
                      })
                      updateFFContent(tree)
                    }
                  }
                }></input>
              </div>
            })
          }
        </div>
      </div>
    </div >
  </>
}