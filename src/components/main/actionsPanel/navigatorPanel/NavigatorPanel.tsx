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

import { SVGIcon } from '@_components/common';
import { TFileNodeData } from '@_node/file';
import { THtmlNodeData } from '@_node/html';
import {
  ffSelector,
  globalSelector,
  MainContext,
  navigatorSelector,
} from '@_redux/main';
import { TProject } from '@_types/main';

import { NavigatorPanelProps } from './types';

const unsavedProjectImg = "https://user-images.githubusercontent.com/13418616/236864312-a08fa9a8-735e-44c1-aa9d-1f74aa8608fd.png"
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
    workspace,
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
    loadProject
  } = useContext(MainContext)
  // -------------------------------------------------------------- favicon --------------------------------------------------------------
  const [favicon, setFavicon] = useState('')
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
    console.log({ workspace, project, ffTree, file, validNodeTree })
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
          position: 'absolute',
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
              <img className='icon-s' src={unsavedProject ? unsavedProjectImg : 'https://rnbw.company/images/favicon.png'}></img>
            </div>
          </>
          <span className="text-s opacity-m">/</span>

          {/* project */}
          <>
            <div className="gap-s align-center" onClick={onProjectClick}>
              <div className="radius-m icon-s align-center background-secondary">
                {favicon === null || favicon === "" ? 
                  <></> : 
                  <img className='icon-s' src={project.context === 'idb' ? 'https://rnbw.company/images/favicon.png' : favicon}></img>
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
              <SVGIcon {...{ "class": "icon-xs" }}>{ffTree[file.uid].data.type == 'html' && ffTree[file.uid].data.name == 'index' ? 'home' : filesReferenceData[(ffTree[file.uid].data as TFileNodeData).ext.substring(1, (ffTree[file.uid].data as TFileNodeData).ext.length)] ? filesReferenceData[(ffTree[file.uid].data as TFileNodeData).ext.substring(1, (ffTree[file.uid].data as TFileNodeData).ext.length)].Icon : 'page'}</SVGIcon>
              <span className="text-s">{file.name}</span>
            </div>
          </>}
        </> :
          navigatorDropDownType === 'workspace' ? <>
            {/* workspace */}
            <>
              <div  style={{'minWidth': '24px'}} className="radius-m icon-s align-center background-secondary" onClick={onWorkspaceClick}>
                <img className='icon-s' src={unsavedProject ? unsavedProjectImg : 'https://rnbw.company/images/favicon.png'}></img>
              </div>
            </>
          </> :
            navigatorDropDownType === 'project' ? <>
              {/* workspace */}
              <>
                <div className="radius-m icon-s align-center background-secondary" onClick={onWorkspaceClick}>
                  <img className='icon-s' src={unsavedProject ? unsavedProjectImg : 'https://rnbw.company/images/favicon.png'}></img>
                </div>
              </>
              <span className="text-s opacity-m">/</span>

              {/* project */}
              <>
                <div className="gap-s align-center" onClick={onProjectClick}>
                  <div className="radius-m icon-s align-center background-secondary">
                    {favicon === null || favicon === "" ? 
                      <></> : 
                      <img className='icon-s' src={project.context === 'idb' ? 'https://rnbw.company/images/favicon.png' : favicon}></img>
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
          position: 'fixed',
          inset: 0,
          zIndex: 1,
        }}
        ref={navigatorDropDownRef}
        onClick={onCloseDropDown}
      >
        <div className='view' />

        {navigatorDropDownType === 'workspace' ?
          <div
            className='border-left border-right border-bottom radius-s background-primary shadow'
            style={{
              position: 'absolute',
              left: Number(navigatorPanelRef.current?.getBoundingClientRect().left),
              top: Number(navigatorPanelRef.current?.getBoundingClientRect().top) + 41,

              width: Number(navigatorPanelRef.current?.clientWidth),
              maxHeight: '300px',

              borderTopLeftRadius: '0px',
              borderTopRightRadius: '0px',

              zIndex: '2',
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
                    <SVGIcon {...{ "class": "icon-xs" }}>folder</SVGIcon>
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
    onOpenProject, loadProject, favicon, unsavedProject
  ])
}