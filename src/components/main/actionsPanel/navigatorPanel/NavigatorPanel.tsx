import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import cx from 'classnames';
import { getMany } from 'idb-keyval';
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
import {
  ffSelector,
  globalSelector,
  MainContext,
  navigatorSelector,
  selectFNNode,
} from '@_redux/main';
import { TProject } from '@_types/main';

import { NavigatorPanelProps } from './types';

const unsavedDarkProjectImg = 'https://rnbw.company/images/favicon-dark-active.png'
const unsavedLightProjectImg = 'https://rnbw.company/images/favicon-light-active.png'
const projectDarkImg = 'https://rnbw.company/images/favicon-dark.png'
const projectLightImg = 'https://rnbw.company/images/favicon-light.png'
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
    parseFileFlag, setParseFile,
    favicon, setFavicon
  } = useContext(MainContext)
  // -------------------------------------------------------------- favicon --------------------------------------------------------------
  const isFirst = useRef(true)
  useEffect(() => {
    isFirst.current = true
  }, [file.uid])

  const [faviconFallback, setFaviconFallback] = useState(false)
  const handleImageError = useCallback(() => {
    console.log('error')
    setFaviconFallback(true)
  }, [faviconFallback])

  useEffect(() => {
    setFaviconFallback(false)
    // set favicons of the workspace
    if (file.uid === `${RootNodeUid}/index.html`) {
      // if (validNodeTree) {
      //   let hasFavicon = false
      //   for (const x in validNodeTree) {
      //     const nodeData = validNodeTree[x].data as THtmlNodeData
      //     if (nodeData && nodeData.type === 'tag' && nodeData.name === 'link' && nodeData.attribs.rel === 'icon') {
      //       if (nodeData.attribs.href.startsWith('http') || nodeData.attribs.href.startsWith('//')) {
      //         setFavicon(nodeData.attribs.href)
      //       }
      //       else{
      //         setFavicon(window.location.origin + '/rnbw/' + project.name + '/' + nodeData.attribs.href)
      //       }
      //       hasFavicon = true
      //     }
      //   }
  
      //   if (!hasFavicon) {
      //     setFavicon('')
      //   }
      // }
      // else{
      //   setFavicon('')
      // }

      let hasFavicon = false
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
          dispatch(selectFNNode([firstNodeId]))
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
      link.href = unsavedProject ? (theme === 'Light' ? unsavedLightProjectImg : unsavedDarkProjectImg) : (theme === 'Light' ? projectLightImg : projectDarkImg)
    }
  }, [unsavedProject, theme]);
  // -------------------------------------------------------------- dropdown --------------------------------------------------------------
  const navigatorPanelRef = useRef<HTMLDivElement | null>(null)
  const navigatorDropDownRef = useRef<HTMLDivElement | null>(null)
  const onWorkspaceClick = useCallback(async () => {
    const sessionInfo = await getMany(['recent-project-context', 'recent-project-name', 'recent-project-handler'])
    if (sessionInfo[0] && sessionInfo[1] && sessionInfo[2] && navigatorDropDownType !== 'workspace') {
      setNavigatorDropDownType('workspace')
    }
  }, [navigatorDropDownType])
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
    if (ffTree) {
      // confirm files' changes
      let hasChangedFile = false
      for (let x in ffTree) {
        const _file = ffTree[x]
        const _fileData = _file.data as TFileNodeData
        if (_file && _fileData.changed) {
          hasChangedFile = true
        }
      }
      if (hasChangedFile) {
        const message = `Your changes will be lost if you don't save them. Are you sure you want to continue without saving?`
        if (!window.confirm(message)) {
          return
        }
      }
    } 
    loadProject(project.context, project.handler, false)
  }, [ffTree])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('file')
  }, [])

  return useMemo(() => {
    return file.uid !== '' ? <>
      <div
        id="NavigatorPanel"
        className='padding-m border-bottom gap-s'
        onClick={onPanelClick}
        ref={navigatorPanelRef}
      >
        {!navigatorDropDownType ? 
        <>
          {/* workspace */}
          {/* <>
            <div onClick={onWorkspaceClick}>
              <img className='icon-s' src={unsavedProject ? (theme === 'Light' ? unsavedLightProjectImg : unsavedDarkProjectImg) : (theme === 'Light' ? projectLightImg : projectDarkImg)}></img>
            </div>
          </> */}
          {/* <span className="text-s opacity-m">/</span> */}

          {/* project */}
          <>
            <div className="gap-s align-center" onClick={onProjectClick}>
                {/* {favicon === null || favicon === "" || faviconFallback ?  */}
                  <SVGIconI {...{ "class": "icon-xs" }}>folder</SVGIconI>
                  {/* <img className='icon-s' onError={handleImageError} style={{'width': '18px', 'height' : '18px'}} src={project.context === 'idb' ? 'https://rnbw.company/images/favicon.png' : favicon}></img> */}
                {/* } */}
              <span className="text-s" style={{'maxWidth': '60px', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap', 'overflow': 'hidden'}}>{project.name}</span>
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
              <SVGIconI {...{ "class": "icon-xs" }}>{ffTree[file.uid].data.type == 'html' && ffTree[file.uid].data.name == 'index' && ffTree[file.uid].parentUid === 'ROOT' ? 'home' : filesReferenceData[(ffTree[file.uid].data as TFileNodeData).ext.substring(1, (ffTree[file.uid].data as TFileNodeData).ext.length)] && (ffTree[file.uid].data as TFileNodeData).ext.substring(1, (ffTree[file.uid].data as TFileNodeData).ext.length) !== 'md' ? filesReferenceData[(ffTree[file.uid].data as TFileNodeData).ext.substring(1, (ffTree[file.uid].data as TFileNodeData).ext.length)].Icon : 'page'}</SVGIconI>
              <span className="text-s" style={{'width': (file.parentUid !== 'ROOT' ? '60px' : '90px'), 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap', 'overflow': 'hidden'}}>{file.uid.split('/')[file.uid.split('/').length - 1]}</span>
              {ffTree[file.uid] && (ffTree[file.uid].data as TFileNodeData).changed &&
                    <div className="radius-s foreground-primary" title='unsaved file' style={{ width: "6px", height: "6px" }}></div>}
            </div>
          </>}
        </> :
          navigatorDropDownType === 'workspace' ? 
          <>
            {/* workspace */}
            {/* <>
              <div onClick={onWorkspaceClick}>
                <img className='icon-s' src={unsavedProject ? (theme === 'Light' ? unsavedLightProjectImg : unsavedDarkProjectImg) : (theme === 'Light' ? projectLightImg : projectDarkImg)}></img>
              </div>
            </> */}
          </> :
            navigatorDropDownType === 'project' ? 
            <>
              {/* workspace */}
              {/* <>
                <div onClick={onWorkspaceClick}>
                  <img className='icon-s' src={unsavedProject ? (theme === 'Light' ? unsavedLightProjectImg : unsavedDarkProjectImg) : (theme === 'Light' ? projectLightImg : projectDarkImg)}></img>
                </div>
              </>
              <span className="text-s opacity-m">/</span> */}

              {/* project */}
              <>
                <div className="gap-s align-center" onClick={onProjectClick}>

                    {/* {favicon === null || favicon === "" || faviconFallback ?  */}
                      <SVGIconI {...{ "class": "icon-xs" }}>folder</SVGIconI> 
                      {/* <img className='icon-s' onError={handleImageError} style={{'width': '18px', 'height' : '18px'}} src={project.context === 'idb' ? 'https://rnbw.company/images/favicon.png' : favicon}></img> */}
                    {/* } */}

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
                  <div className="navigator-project-item-icon">
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
    onOpenProject, loadProject, favicon, unsavedProject, setParseFile, theme, faviconFallback
  ])
}