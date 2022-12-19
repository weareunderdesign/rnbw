import React, {
  useContext,
  useEffect,
  useRef,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';
import ReactShadowRoot from 'react-shadow-root';

import * as Main from '@_redux/main';
import { MainContext } from '@_redux/main';

import NodeRenderer from './nodeRenderer';
import { StageViewProps } from './types';

const styles = `
  :host {
    display: inline-flex;
  }
  .rnbwdev-rainbow-component-hover {
    outline: 1px dashed blue;
    outline-offset: -1px;
  }
  .rnbwdev-rainbow-component-focus {
    outline: 1px solid blue;
    outline-offset: -1px;
  }
`

export default function StageView(props: StageViewProps) {
  // shadow root css
  const sheet: CSSStyleSheet = new CSSStyleSheet()
  sheet.replaceSync(styles)
  const styleSheets = [sheet]

  const dispatch = useDispatch()

  // for groupping action - it contains the actionNames as keys which should be in the same group
  const runningActions = useRef<{ [actionName: string]: boolean }>({})
  const noRunningAction = () => {
    return Object.keys(runningActions.current).length === 0 ? true : false
  }
  const addRunningAction = (actionNames: string[]) => {
    for (const actionName of actionNames) {
      runningActions.current[actionName] = true
    }
  }
  const removeRunningAction = (actionNames: string[], effect: boolean = true) => {
    for (const actionName of actionNames) {
      delete runningActions.current[actionName]
    }
    if (effect && noRunningAction()) {
      dispatch(Main.increaseActionGroupIndex())
    }
  }

  // main context
  const { ffHoveredItem, setFFHoveredItem, ffHandlers, setFFHandlers, fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree, command } = useContext(MainContext)

  // redux state
  const { workspace, openedFiles, currentFile: { uid: currentFileUid, type, content }, pending, messages } = useSelector(Main.globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(Main.fnSelector)


  useEffect(() => {
    console.log(nodeTree)
  }, [nodeTree])

  return (
    <div className="panel box padding-xs shadow border-left">
      <div className='box border-top border-right border-bottom border-left' style={{ maxHeight: "calc(100vh - 41px - 80px - 12px)", overflow: "auto" }}>
        <ReactShadowRoot stylesheets={styleSheets}>
          {<NodeRenderer id={'ROOT'}></NodeRenderer>}
        </ReactShadowRoot>
      </div>
    </div >
  )
}