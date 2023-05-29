import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import cx from 'classnames';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  SVGIcon,
  SVGIconI,
} from '@_components/common';
import { RootNodeUid } from '@_constants/main';
import { TFileNodeData } from '@_node/file';
import { THtmlNodeData } from '@_node/html';
import { TNodeUid } from '@_node/types';
import {
  expandFNNode,
  ffSelector,
  focusFNNode,
  globalSelector,
  MainContext,
  navigatorSelector,
  selectFNNode,
} from '@_redux/main';
import { TProject } from '@_types/main';

import { NavigatorPanelProps } from './types';

const unsavedProjectImg = "https://private-user-images.githubusercontent.com/13418616/240330904-3b1aa8a3-50d8-44ce-bfac-da7db56f73c9.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJrZXkxIiwiZXhwIjoxNjg1MzE5NzM0LCJuYmYiOjE2ODUzMTk0MzQsInBhdGgiOiIvMTM0MTg2MTYvMjQwMzMwOTA0LTNiMWFhOGEzLTUwZDgtNDRjZS1iZmFjLWRhN2RiNTZmNzNjOS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBSVdOSllBWDRDU1ZFSDUzQSUyRjIwMjMwNTI5JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDIzMDUyOVQwMDE3MTRaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0xZGQ1NTU1ZTYzNDQ1MGI0OGE0Y2ZlNTgwZGVkYTU1NDg2Y2EzMDE1OTNlODczYTJjZjdhZjlmMGQzNjFkNzQwJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.dzHziHUg7KTW93v7NlgUPZ68W-SkkKzqmy6z0Aq0D4M"
const unsavedProjectSvg = "https://private-user-images.githubusercontent.com/13418616/240330887-4632d52b-5b54-4811-b81b-277eb42a1f81.svg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJrZXkxIiwiZXhwIjoxNjg1MzE5NzM0LCJuYmYiOjE2ODUzMTk0MzQsInBhdGgiOiIvMTM0MTg2MTYvMjQwMzMwODg3LTQ2MzJkNTJiLTViNTQtNDgxMS1iODFiLTI3N2ViNDJhMWY4MS5zdmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBSVdOSllBWDRDU1ZFSDUzQSUyRjIwMjMwNTI5JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDIzMDUyOVQwMDE3MTRaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04MzJmYjRjNzUyMmUzMzE0ODFlMjQ5ODc3MDZjYTljMDA2MWUyMzAxNjkwMzE3N2UzNTIyYmNhNzk2MmRhMzNiJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.dXubeBFRLhZ-GUp037Y64kJoj9SgbPA0WkQ30eoTP58"
const projectImg = "https://private-user-images.githubusercontent.com/13418616/240330897-82460c16-fd60-455b-9620-de5ec0dec94d.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJrZXkxIiwiZXhwIjoxNjg1MzE5NzM0LCJuYmYiOjE2ODUzMTk0MzQsInBhdGgiOiIvMTM0MTg2MTYvMjQwMzMwODk3LTgyNDYwYzE2LWZkNjAtNDU1Yi05NjIwLWRlNWVjMGRlYzk0ZC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBSVdOSllBWDRDU1ZFSDUzQSUyRjIwMjMwNTI5JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDIzMDUyOVQwMDE3MTRaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1mYTk3YWIyODliOTQ4MzlmOTIzYzhhODk1M2U4MTRkZmI3MjFjOGQ3ZmMwZDEyZGI0MmJjOTRlZjU1ZjdlZDRjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.7h9x270eJxYjMKtJEqtGvpERapYinAuW8ycYLm3GUaM"
const projectSvg = "https://private-user-images.githubusercontent.com/13418616/240330902-f79b4bb2-3054-49a0-a766-2233d295adc9.svg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJrZXkxIiwiZXhwIjoxNjg1MzE5NzM0LCJuYmYiOjE2ODUzMTk0MzQsInBhdGgiOiIvMTM0MTg2MTYvMjQwMzMwOTAyLWY3OWI0YmIyLTMwNTQtNDlhMC1hNzY2LTIyMzNkMjk1YWRjOS5zdmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBSVdOSllBWDRDU1ZFSDUzQSUyRjIwMjMwNTI5JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDIzMDUyOVQwMDE3MTRaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1lYWI1NmFkMjJjMDZkYTAyYWQ5YWE5Yzg0M2EyNTY2YmJiYzBlN2UyOTQ0ZTJiYWE1ODBiN2VhNTM2NjhiMWNmJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.8GwUQLa0nR85C9E-0Cajw6CtoLvfMsZ9yfAH_TVBaPY"
export default function NavigatorPanel(props: NavigatorPanelProps) {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  const {
    // global action
    addRunningActions, removeRunningActions,
    // navigator
    workspace, setWorkspace,
    project,
    navigatorDropDownType, setNavigatorDropDownType,
    // node actions
    activePanel, setActivePanel,
    clipboardData, setClipboardData,
    event, setEvent,
    // actions panel
    showActionsPanel,
    // file tree view
    initialFileToOpen, setInitialFileToOpen,
    fsPending, setFSPending,
    ffTree, setFFTree, setFFNode,
    ffHandlers, setFFHandlers,
    ffHoveredItem, setFFHoveredItem,
    isHms, setIsHms,
    ffAction, setFFAction,
    currentFileUid, setCurrentFileUid,
    // node tree view
    fnHoveredItem, setFNHoveredItem,
    nodeTree, setNodeTree,
    validNodeTree, setValidNodeTree,
    nodeMaxUid, setNodeMaxUid,
    // stage view
    iframeLoading, setIFrameLoading,
    iframeSrc, setIFrameSrc,
    fileInfo, setFileInfo,
    needToReloadIFrame, setNeedToReloadIFrame,
    linkToOpen, setLinkToOpen,
    // code view
    codeEditing, setCodeEditing,
    codeChanges, setCodeChanges,
    tabSize, setTabSize,
    newFocusedNodeUid, setNewFocusedNodeUid,
    // processor
    updateOpt, setUpdateOpt,
    // references
    filesReferenceData, htmlReferenceData, cmdkReferenceData,
    // cmdk
    currentCommand, setCurrentCommand,
    cmdkOpen, setCmdkOpen,
    cmdkPages, setCmdkPages, cmdkPage,
    // other
    osType,
    theme,
    // toasts
    addMessage, removeMessage,
    // open project
    loadProject,
    parseFileFlag, setParseFile
  } = useContext(MainContext)
  // -------------------------------------------------------------- favicon --------------------------------------------------------------
  const [favicon, setFavicon] = useState('')
  const isFirst = useRef(true)
  useEffect(() => {
    isFirst.current = true
  }, [file.uid])

  const [projectFavicons, setProjectFavicons] = useState([])

  useEffect(() => {
    if (validNodeTree) {
      let hasFavicon = false
      for (const x in validNodeTree) {
        const nodeData = validNodeTree[x].data as THtmlNodeData
        if (nodeData && nodeData.type === 'tag' && nodeData.name === 'link' && nodeData.attribs.rel === 'icon') {
          setFavicon(window.location.origin + '/rnbw/' + project.name + '/' + nodeData.attribs.href)
          hasFavicon = true
        }
      }

      if (!hasFavicon) {
        setFavicon('')
      }
    }
    else{
      setFavicon('')
    }

    // set favicons of the workspace
    if (file.uid === `${RootNodeUid}/index.html`) {

      let hasFavicon = false
      let temp = projectFavicons
      for (const x in validNodeTree) {
        const nodeData = validNodeTree[x].data as THtmlNodeData
        if (nodeData && nodeData.type === 'tag' && nodeData.name === 'link' && nodeData.attribs.rel === 'icon') {
          const _projects: TProject[] = []
          const pts = workspace.projects as TProject[]
          pts.map((_v, index) => {
            if (_v.name != 'idb'){
              _projects.push({
                context: _v.context,
                name: _v.name,
                handler: _v.handler,
                favicon: _v.name === project.name ? window.location.origin + '/rnbw/' + project.name + '/' + nodeData.attribs.href : _v.favicon
              })
            }
          })
          // projectFavicons[project.name] = window.location.origin + '/rnbw/' + project.name + '/' + nodeData.attribs.href
          setWorkspace({ name: workspace.name, projects: _projects })
        }
      }
    }
    if (file.uid !== '' && isFirst.current === true) {
      let bodyId = '0'
      for (let x in validNodeTree) {
        if (validNodeTree[x].data.type === 'tag' && validNodeTree[x].data.name === 'body'){
          bodyId = validNodeTree[x].uid
          break;
        }
      }
      if (bodyId !== '0') {
        let firstNodeId = '0'
        for (let x in validNodeTree) {
          if (validNodeTree[x].data.type === 'tag' && validNodeTree[x].parentUid === bodyId){
            firstNodeId = validNodeTree[x].uid
            break;
          }
        }
        if (firstNodeId !== '0') {
          addRunningActions(['stageView-focus'])
          // expand path to the uid
          const _expandedItems: TNodeUid[] = []
          let node = nodeTree[firstNodeId]
          while (node.uid !== RootNodeUid) {
            _expandedItems.push(node.uid)
            node = nodeTree[node.parentUid as TNodeUid]
          }
          _expandedItems.shift()
          dispatch(expandFNNode(_expandedItems))
          dispatch(focusFNNode(firstNodeId))
          dispatch(selectFNNode([firstNodeId]))
          removeRunningActions(['stageView-focus'])
          isFirst.current = false
        }
      }
    }
    console.log({ workspace, project, ffTree, file, validNodeTree, selectedItems})
  }, [validNodeTree])
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  const [unsavedProject, setUnsavedProject] = useState(false)
  useMemo(() => {
    setUnsavedProject(false)
    for (let x in ffTree){
      if (!ffTree[x].data) continue 
      const nodeData = ffTree[x].data as unknown as TFileNodeData
      if (nodeData.changed) {
        
        setUnsavedProject(true)
      }
    }
  }, [ffTree])

  // set app's favicon
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    if (link) {
      link.href = unsavedProject ? unsavedProjectImg : projectImg
    }
  }, [unsavedProject]);
  // -------------------------------------------------------------- dropdown --------------------------------------------------------------
  const navigatorPanelRef = useRef<HTMLDivElement | null>(null)
  const navigatorDropDownRef = useRef<HTMLDivElement | null>(null)
  const onWorkspaceClick = useCallback(() => {
    setNavigatorDropDownType('workspace')
  }, [])
  const onProjectClick = useCallback(() => {
    setNavigatorDropDownType('project')
  }, [])
  const onFileClick = useCallback(() => {
    setNavigatorDropDownType('project')
  }, [])
  const onCloseDropDown = useCallback(() => {
    setNavigatorDropDownType(null)
  }, [])
  // -------------------------------------------------------------- handlers --------------------------------------------------------------
  const onOpenProject = useCallback((project: TProject) => {
    console.log('open project', { project })
    loadProject(project.context, project.handler, false)
  }, [])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('file')
  }, [])

  return useMemo(() => {
    return file.uid !== '' ? <>
      <div
        id="NavigatorPanel"
        style={{
          // position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',

          overflow: 'auto',

          display: 'flex',
          alignItems: 'center',
        }}
        className='padding-s border-bottom gap-s'
        onClick={onPanelClick}
        ref={navigatorPanelRef}
      >
        {!navigatorDropDownType ? <>
          {/* workspace */}
          <>
            <div style={{'minWidth': '24px'}} className="radius-m icon-s align-center background-secondary" onClick={onWorkspaceClick}>
              <img className='icon-s' src={unsavedProject ? unsavedProjectSvg : projectSvg}></img>
            </div>
          </>
          <span className="text-s opacity-m">/</span>

          {/* project */}
          <>
            <div className="gap-s align-center" onClick={onProjectClick}>
              <div className="radius-m icon-s align-center">
                {favicon === null || favicon === "" ? 
                  <></> : 
                  <img className='icon-s' style={{'borderRadius': '50%'}} src={project.context === 'idb' ? 'https://rnbw.company/images/favicon.png' : favicon}></img>
                }
              </div>
              <span className="text-s">{project.name}</span>
            </div>
          </>
          <span className="text-s opacity-m">/</span>

          {/* path */}
          {file.parentUid !== 'ROOT' && <>
            <span className="text-s">...</span>
            <span className="text-s opacity-m">/</span>
          </>}

          {/* file */}
          {ffTree[file.uid] && <>
            <div className="gap-s align-center" onClick={onFileClick}>
              <SVGIconI {...{ "class": "icon-xs" }}>{ffTree[file.uid].data.type == 'html' && ffTree[file.uid].data.name == 'index' ? 'home' : filesReferenceData[(ffTree[file.uid].data as TFileNodeData).ext.substring(1, (ffTree[file.uid].data as TFileNodeData).ext.length)] ? filesReferenceData[(ffTree[file.uid].data as TFileNodeData).ext.substring(1, (ffTree[file.uid].data as TFileNodeData).ext.length)].Icon : 'page'}</SVGIconI>
              <span className="text-s">{file.name}</span>
            </div>
          </>}
        </> :
          navigatorDropDownType === 'workspace' ? <>
            {/* workspace */}
            <>
              <div  style={{'minWidth': '24px'}} className="radius-m icon-s align-center background-secondary" onClick={onWorkspaceClick}>
                <img className='icon-s' src={unsavedProject ? unsavedProjectSvg : projectSvg}></img>
              </div>
            </>
          </> :
            navigatorDropDownType === 'project' ? <>
              {/* workspace */}
              <>
                <div className="radius-m icon-s align-center background-secondary" onClick={onWorkspaceClick}>
                  <img className='icon-s' src={unsavedProject ? unsavedProjectSvg : projectSvg}></img>
                </div>
              </>
              <span className="text-s opacity-m">/</span>

              {/* project */}
              <>
                <div className="gap-s align-center" onClick={onProjectClick}>
                  <div className="radius-m icon-s align-center">
                    {favicon === null || favicon === "" ? 
                      <></> : 
                      <img className='icon-s' style={{'borderRadius': '50%'}} src={project.context === 'idb' ? 'https://rnbw.company/images/favicon.png' : favicon}></img>
                    }
                  </div>
                  <span className="text-s">{project.name}</span>
                </div>
              </>
              <span className="text-s opacity-m">/</span>
            </> : <></>}
      </div>

      {navigatorDropDownType && <div
        style={{
          inset: 0,
          zIndex: 1,
        }}
        ref={navigatorDropDownRef}
        onClick={onCloseDropDown}
      >
        <div className='view' style={{'minHeight' : '0px'}} />

        {navigatorDropDownType === 'workspace' ?
          <div
            className='border-left border-right border-bottom radius-s background-primary shadow'
            style={{
              // left: Number(navigatorPanelRef.current?.getBoundingClientRect().left),
              // top: Number(navigatorPanelRef.current?.getBoundingClientRect().top) + 41,

              width: Number(navigatorPanelRef.current?.clientWidth),
              maxHeight: '300px',

              borderTopLeftRadius: '0px',
              borderTopRightRadius: '0px',

              zIndex: 2,
            }}
          >
            {workspace.projects.map((_project, index) => {
              return _project.context == 'idb' ? <></> : <div
                key={index}
                className={cx(
                  'navigator-project-item',
                  'justify-stretch padding-s',
                  (_project.context === project.context && _project.name === project.name && _project.handler === project.handler) ? 'selected' : '',
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenProject(_project)
                }}>
                <div className="gap-s align-center">
                  <div className="navigator-project-item-icon radius-m icon-s align-center">
                    {_project.favicon ? <img className='icon-s' style={{'borderRadius': '50%'}} src={_project.favicon}></img> : <SVGIcon {...{ "class": "icon-xs" }}>folder</SVGIcon>}
                  </div>
                  <span className="navigator-project-item-name text-s">{_project.name}</span>
                </div>
              </div>
            })}
          </div> : null}
      </div>}
    </> : <></>
  }, [
    onPanelClick,
    workspace, project, file,
    filesReferenceData, ffTree,
    onWorkspaceClick, onProjectClick, onFileClick,
    navigatorDropDownType, onCloseDropDown,
    onOpenProject, loadProject, favicon, unsavedProject, setParseFile
  ])
}