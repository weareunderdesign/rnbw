import './SettingsPanel.css';

import React, {
  useCallback,
  useContext,
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
import { globalSelector } from '@_redux/main';

import { SettingsPanelProps } from './types';

type StyleProperty = {
  name: string,
  value: string,
}

export default function SettingsPanel(props: SettingsPanelProps) {
  const dispatch = useDispatch()

  const [styleLists, setStyleLists] = useState<Record<string, StyleProperty>>({})

  // main context
  const {
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree, updateFF,

    // ndoe tree view
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,

    // update opt
    updateOpt, setUpdateOpt,

    // ff hms
    isHms, setIsHms, ffAction, setFFAction,

    // cmdk
    currentCommand, setCurrentCommand, cmdkOpen, setCmdkOpen, cmdkPages, setCmdkPages, cmdkPage,

    // global
    pending, setPending, messages, addMessage, removeMessage,

    // reference
    htmlReferenceData, cmdkReferenceData, cmdkReferenceJumpstart, cmdkReferenceActions,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,
  } = useContext(Main.MainContext)


  const { currentFile } = useSelector(globalSelector)

  useEffect(() => {
    let elements: Record<string, StyleProperty> = {}

    // show default styles like margin, padding, etc...
    const defaultStyles = ["margin", "padding"]
    defaultStyles.map((name) => {
      elements[name] = {
        name,
        value: "",
      }
    })
    setStyleLists(elements)
  }, [])

  /**
   * It's for saving styles
   * @param styleList 
   * @returns Object { name : value }
   */
  const convertStyle = (styleList: Record<string, StyleProperty>) => {
    const result: { [styleName: string]: string } = {}
    Object.keys(styleList).map((key) => {
      const styleItem = styleList[key]
      result[styleItem.name] = styleItem.value
    })
    return result
  }

  // update the file content
  const updateFFContent = useCallback(async (tree: TTree) => {
    const newContent = serializeFile({ type: currentFile.type, tree, referenceData: htmlReferenceData })
    dispatch(Main.updateFileContent(newContent))
  }, [currentFile.type])

  return <>
    <div className="panel">
      <div className="border-bottom" style={{ height: "100px", overflow: "auto" }}>
        {/* Nav Bar */}
        <div className="sticky direction-column padding-s box-l justify-stretch border-bottom background-primary">
          <div className="gap-s box justify-start">
            {/* label */}
            <span className="text-s">Settings</span>
          </div>
          <div className="gap-s justify-end box">
            {/* action button */}
            <div className="icon-add opacity-m icon-xs" onClick={() => { }}></div>
          </div>
        </div>

        {/* panel body */}
        <div className="direction-row">
          {false && Object.keys(styleLists).map((key) => {
            const styleItem = styleLists[key]
            return <div key={'attr_' + styleItem.name}>
              <label className='text-s'>{styleItem.name}:</label>
              <input
                className='text-s opacity-m'
                type="text"
                value={styleItem.value}
                onChange={(e) => {
                  // display chages of style properties
                  const newStyleList = JSON.parse(JSON.stringify(styleLists))
                  newStyleList[key].value = e.target.value
                  setStyleLists(newStyleList)

                  // props changed
                  addRunningActions(['updateNode'])
                  const tree = JSON.parse(JSON.stringify(nodeTree))
                  updateNode({
                    tree: tree,
                    data: {
                      style: convertStyle(newStyleList),
                    },
                    uid: '',
                  })
                  updateFFContent(tree)
                  removeRunningActions(['updateNode'])
                }}
              />
            </div>
          })}
        </div>
      </div>
    </div>
  </>
}