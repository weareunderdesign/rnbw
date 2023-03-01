import './SettingsPanel.css';

import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import cx from 'classnames';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { Panel } from 'react-resizable-panels';

import {
  serializeFile,
  updateNode,
} from '@_node/apis';
import { TNodeTreeData } from '@_node/types';
import {
  fnSelector,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  MainContext,
  navigatorSelector,
  setCurrentFileContent,
} from '@_redux/main';

import { SettingsPanelProps } from './types';

type StyleProperty = {
  name: string,
  value: string,
}

export default function SettingsPanel(props: SettingsPanelProps) {
  const dispatch = useDispatch()

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
    htmlReferenceData, cmdkReferenceData, cmdkReferenceJumpstart, cmdkReferenceActions, cmdkReferenceAdd,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    osType,

    // code view
    tabSize, setTabSize,

    // panel-resize
    panelResizing,
  } = useContext(MainContext)

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file, openedFiles } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)


  const [styleLists, setStyleLists] = useState<Record<string, StyleProperty>>({})

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
  const updateFFContent = useCallback(async (tree: TNodeTreeData) => {
    const newContent = serializeFile(file.type, tree, htmlReferenceData)
    dispatch(setCurrentFileContent(newContent))
  }, [file.type])

  // -------------------------------------------------------------- other --------------------------------------------------------------
  // panel focus handler
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('settings')
  }, [])

  // panel size handler
  const [panelSize, setPanelSize] = useState(200 / window.innerHeight * 100)
  useEffect(() => {
    const windowResizeHandler = () => {
      setPanelSize(200 / window.innerHeight * 100)
    }
    window.addEventListener('resize', windowResizeHandler)

    return () => window.removeEventListener('resize', windowResizeHandler)
  }, [])
  // -------------------------------------------------------------- other --------------------------------------------------------------

  return <>
    <Panel defaultSize={panelSize} minSize={0}>
      <div
        id="SettingsView"
        className={cx(
          'scrollable',
          // activePanel === 'settings' ? "outline outline-primary" : "",
        )}
        style={{
          pointerEvents: panelResizing ? 'none' : 'auto',
        }}
        onClick={onPanelClick}
      >
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
                updateNode(
                  tree,
                  '',
                  {
                    style: convertStyle(newStyleList),
                  },
                )
                updateFFContent(tree)
                removeRunningActions(['updateNode'])
              }}
            />
          </div>
        })}
      </div>
    </Panel>
  </>
}