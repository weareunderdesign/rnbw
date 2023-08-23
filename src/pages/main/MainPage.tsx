import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import cx from 'classnames';
import { Command } from 'cmdk';
import {
  CustomDirectoryPickerOptions,
} from 'file-system-access/lib/showDirectoryPicker';
import {
  delMany,
  getMany,
  setMany,
} from 'idb-keyval';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import {
  useLocation,
  useParams,
} from 'react-router-dom';

import { SVGIcon } from '@_components/common';
import {
  ActionsPanel,
  CodeView,
  Process,
  StageView,
} from '@_components/main';
import {
  AddActionPrefix,
  DefaultProjectPath,
  DefaultTabSize,
  HmsClearActionType,
  LogAllow,
  ParsableFileTypes,
  RecentProjectCount,
  RootNodeUid,
} from '@_constants/main';
import {
  downloadProject,
  initIDBProject,
  loadIDBProject,
  loadLocalProject,
  TFileHandlerCollection,
  TFileNodeData,
  TFilesReference,
  TFilesReferenceData,
} from '@_node/file';
import {
  THtmlElementsReference,
  THtmlElementsReferenceData,
  THtmlReferenceData,
} from '@_node/html';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '@_node/types';
import {
  clearMainState,
  ffSelector,
  fnSelector,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  increaseActionGroupIndex,
  MainContext,
  navigatorSelector,
  removeCurrentFile,
  setFileAction,
  TCommand,
  TNavigatorDropDownType,
  TUpdateOptions,
} from '@_redux/main';
// @ts-ignore
import cmdkRefActions from '@_ref/cmdk.ref/Actions.csv';
// @ts-ignore
import cmdkRefJumpstart from '@_ref/cmdk.ref/Jumpstart.csv';
// @ts-ignore
import filesRef from '@_ref/rfrncs/Files.csv';
// @ts-ignore
import htmlRefElements from '@_ref/rfrncs/HTML Elements.csv';
import {
  TOsType,
  TTheme,
  TToast,
} from '@_types/global';
import {
  TClipboardData,
  TCmdkContext,
  TCmdkContextScope,
  TCmdkGroupData,
  TCmdkKeyMap,
  TCmdkReference,
  TCmdkReferenceData,
  TCodeChange,
  TEvent,
  TFileAction,
  TFileInfo,
  TPanelContext,
  TProject,
  TProjectContext,
  TSession,
  TWorkspace,
} from '@_types/main';

import { getCommandKey } from '../../services/global';
import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  // -------------------------------------------------------------- redux  --------------------------------------------------------------
  const dispatch = useDispatch()
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)

  //ff is fileTreeViewState
  const { focusedItem: ffFocusedItem, expandedItems: ffExpandedItems, selectedItems: ffSelectedItems, expandedItemsObj: ffExpandedItemsObj, selectedItemsObj: ffSelectedItemsObj } = useSelector(ffSelector)

  //fn is nodeTreeViewState
  const { focusedItem: fnFocusedItem, expandedItems: fnExpandedItems, selectedItems: fnSelectedItems, expandedItemsObj: fnExpandedItemsObj, selectedItemsObj: fnSelectedItemsObj } = useSelector(fnSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // -------------------------------------------------------------- main context --------------------------------------------------------------
  const [favicon, setFavicon] = useState<string>('')
  // global action
  const [pending, setPending] = useState<boolean>(false) // tells if there are any pending running actions
  const runningActions = useRef<{ [actionName: string]: boolean }>({})
  const noRunningAction = useCallback(() => {
    return Object.keys(runningActions.current).length === 0 ? true : false
  }, [])
  const addRunningActions = useCallback((actionNames: string[]) => {
    let found: boolean = false
    for (const actionName of actionNames) {
      if (runningActions.current[actionName] === undefined) {
        runningActions.current[actionName] = true
        found = true
      }
    }
    if (!found) return

    setPending(true)
  }, [])
  const removeRunningActions = useCallback((actionNames: string[], effect: boolean = true) => {
    let found: boolean = false
    for (const actionName of actionNames) {
      if (runningActions.current[actionName] !== undefined) {
        delete runningActions.current[actionName]
        found = true
      }
    }
    if (!found) return

    LogAllow && console.log('remove running actions', actionNames, effect, noRunningAction())

    if (noRunningAction()) {
      LogAllow && effect && console.log('hms added')
      setPending(false)
      effect && dispatch(increaseActionGroupIndex())
    }
  }, [noRunningAction, file.content])
  // navigator
  const [workspace, setWorkspace] = useState<TWorkspace>({ name: 'local', projects: [] })
  const [project, setProject] = useState<TProject>({ context: 'idb', name: 'Untitled', handler: null, favicon: null })
  const [navigatorDropDownType, setNavigatorDropDownType] = useState<TNavigatorDropDownType>(null)
  // node actions
  const [activePanel, setActivePanel] = useState<TPanelContext>('unknown')
  const [clipboardData, setClipboardData] = useState<TClipboardData>({ panel: 'unknown', type: null, uids: [], fileType: 'html', data: [], fileUid: '', prevNodeTree: {} })
  const [event, setEvent] = useState<TEvent>(null)
  // actions panel
  const [showActionsPanel, setShowActionsPanel] = useState(false)
  // file tree view
  const [initialFileToOpen, setInitialFileToOpen] = useState<TNodeUid>('')
  const [fsPending, setFSPending] = useState<boolean>(false)
  const [ffTree, setFFTree] = useState<TNodeTreeData>({})
  const setFFNode = useCallback((ffNode: TNode) => {
    const _ffTree = JSON.parse(JSON.stringify(ffTree))
    _ffTree[ffNode.uid] = JSON.parse(JSON.stringify(ffNode))
    setFFTree(_ffTree)
  }, [ffTree])
  const [ffHandlers, setFFHandlers] = useState<TFileHandlerCollection>({})
  const [ffHoveredItem, setFFHoveredItem] = useState<TNodeUid>('')
  const [isHms, setIsHms] = useState<boolean | null>(null)
  const [ffAction, setFFAction] = useState<TFileAction>({ type: null })
  const [currentFileUid, setCurrentFileUid] = useState<TNodeUid>('')
  // node tree view
  const [fnHoveredItem, setFNHoveredItem] = useState<TNodeUid>('')
  const [nodeTree, setNodeTree] = useState<TNodeTreeData>({})
  const [validNodeTree, setValidNodeTree] = useState<TNodeTreeData>({})
  const [nodeMaxUid, setNodeMaxUid] = useState<number>(0)
  // stage-view
  const [iframeLoading, setIFrameLoading] = useState<boolean>(false)
  const [iframeSrc, setIFrameSrc] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<TFileInfo>(null)
  const [needToReloadIFrame, setNeedToReloadIFrame] = useState<boolean>(true)
  const [linkToOpen, setLinkToOpen] = useState<string>('')
  // code view
  const [codeEditing, setCodeEditing] = useState<boolean>(false)
  const [codeChanges, setCodeChanges] = useState<TCodeChange[]>([])
  const [tabSize, setTabSize] = useState<number>(DefaultTabSize)
  const [newFocusedNodeUid, setNewFocusedNodeUid] = useState<TNodeUid>('')
  // processor
  const [updateOpt, setUpdateOpt] = useState<TUpdateOptions>({ parse: null, from: null })
  // references
  const [filesReferenceData, setFilesReferenceData] = useState<TFilesReferenceData>({})
  const [htmlReferenceData, setHtmlReferenceData] = useState<THtmlReferenceData>({
    elements: {},
  })
  const [cmdkReferenceData, setCmdkReferenceData] = useState<TCmdkReferenceData>({})
  const [cmdkReferenceJumpstart, setCmdkReferenceJumpstart] = useState<TCmdkGroupData>({})
  const [cmdkReferenceActions, setCmdkReferenceActions] = useState<TCmdkGroupData>({})
  // non-parse file editable
  const [parseFileFlag, setParseFile] = useState<boolean>(true)
  const [prevFileUid, setPrevFileUid] = useState<string>('')
  // cmdk
  const [currentCommand, setCurrentCommand] = useState<TCommand>({ action: '' })
  const [cmdkOpen, setCmdkOpen] = useState<boolean>(false)
  const [cmdkPages, setCmdkPages] = useState<string[]>([])

  // first loaded
  const firstLoaded = useRef<number>(0)
  // guide ref
  const guideRef = useRef<HTMLAnchorElement>(null)
  const cmdkPage = useMemo(() => {
    return cmdkPages.length == 0 ? '' : cmdkPages[cmdkPages.length - 1]
  }, [cmdkPages])
  const [cmdkSearch, setCmdkSearch] = useState<string>('')
  const cmdkReferenceAdd = useMemo<TCmdkGroupData>(() => {
    const data: TCmdkGroupData = {
      "Files": [],
      "Elements": [],
      "Recent": [],
    }

    // Files
    const fileNode = ffTree[ffFocusedItem]
    if (fileNode) {
      filesRef.map((fileRef: TFilesReference) => {
        fileRef.Name && data['Files'].push({
          "Featured": fileRef.Featured === 'Yes',
          "Name": fileRef.Name,
          "Icon": fileRef.Icon,
          "Description": fileRef.Description,
          "Keyboard Shortcut": {
            cmd: false,
            shift: false,
            alt: false,
            key: '',
            click: false,
          },
          "Group": 'Add',
          "Context": `File-${fileRef.Extension}`,
        })
      })
    }
    data['Files'] = data['Files'].filter((element) => element.Featured || !!cmdkSearch)
    if (data['Files'].length === 0) {
      delete data['Files']
    }

    // Elements
    let flag = true
    for (let x in nodeTree) {
      if (nodeTree[x].name === "html") {
        flag = false
      }
    }
    const htmlNode = nodeTree[fnFocusedItem]
    if (!flag) {
      if (htmlNode && htmlNode.parentUid && htmlNode.parentUid !== RootNodeUid) {
        const parentNode = nodeTree[htmlNode.parentUid as TNodeUid]
        const refData = htmlReferenceData.elements[parentNode.name]
        if (refData) {
          if (refData.Contain === 'All') {
            Object.keys(htmlReferenceData.elements).map((tag: string) => {
              const tagRef = htmlReferenceData.elements[tag]
              if (tagRef !== undefined) {
                data['Elements'].push({
                  "Featured": tagRef && tagRef.Featured === 'Yes' ? true : false,
                  "Name": tagRef.Name,
                  "Icon": tagRef.Icon,
                  "Description": tagRef.Description,
                  "Keyboard Shortcut": {
                    cmd: false,
                    shift: false,
                    alt: false,
                    key: '',
                    click: false,
                  },
                  "Group": 'Add',
                  "Context": `Node-${tagRef.Tag}`,
                })
              }
            })
          } else if (refData.Contain === 'None') {
            // do nothing
          } else {
            const tagList = refData.Contain.replace(/ /g, '').split(',')
            tagList.map((tag: string) => {
              const pureTag = tag.slice(1, tag.length - 1)
              const tagRef = htmlReferenceData.elements[pureTag]
              if (tagRef !== undefined) {
                data['Elements'].push({
                  "Featured": tagRef && tagRef.Featured === 'Yes' ? true : false,
                  "Name": tagRef.Name,
                  "Icon": tagRef.Icon,
                  "Description": tagRef.Description,
                  "Keyboard Shortcut": {
                    cmd: false,
                    shift: false,
                    alt: false,
                    key: '',
                    click: false,
                  },
                  "Group": 'Add',
                  "Context": `Node-${tagRef.Tag}`,
                })
              }
            })
          }
        }
      }
    }
    else{
      data['Elements'] = []
      let tagRef = htmlReferenceData.elements['html']
      tagRef && data['Elements'].push({
        "Featured": tagRef && tagRef.Featured === 'Yes' ? true : false,
        "Name": tagRef.Name.toUpperCase(),
        "Icon": tagRef.Icon,
        "Description": tagRef.Description,
        "Keyboard Shortcut": {
          cmd: false,
          shift: false,
          alt: false,
          key: '',
          click: false,
        },
        "Group": 'Add',
        "Context": `Node-${tagRef.Tag}`,
      })
    }
    if (data['Elements'].length > 0 && data['Elements'].filter((element) => element.Featured || !!cmdkSearch).length > 0) {
      data['Elements'] = data['Elements'].filter((element) => element.Featured || !!cmdkSearch)
    }
    if (data['Elements'].length === 0) {
      delete data['Elements']
    }

    // Recent
    delete data['Recent']

    return data
  }, [ffTree, ffFocusedItem, nodeTree, fnFocusedItem, htmlReferenceData, cmdkSearch])
  // other
  const [osType, setOsType] = useState<TOsType>('Windows')
  const [theme, setTheme] = useState<TTheme>('System')
  // toasts
  const [messages, setMessages] = useState<TToast[]>([])
  const addMessage = useCallback((message: TToast) => {
    setMessages([...messages, message])
  }, [messages])
  const removeMessage = useCallback((index: number) => {
    const newMessages = JSON.parse(JSON.stringify(messages))
    newMessages.splice(index)
    setMessages(JSON.parse(JSON.stringify(newMessages)))
  }, [messages])
  // -------------------------------------------------------------- routing --------------------------------------------------------------
  // navigating
  const params = useParams()
  const location = useLocation()
  // init workspace

  const isChromeOrEdge = () => {
    const userAgent = navigator.userAgent;
  
    if (userAgent.indexOf('Chrome') > -1) {
      return true; // Current browser is Chrome
    } else if (userAgent.indexOf('Edg') > -1) {
      return true; // Current browser is Edge
    }
  
    return false; // Current browser is not Chrome or Edge
  };

  useEffect(() => {

    // check if current broswer is Chrome or Edge
    if (!isChromeOrEdge()) {
      const message = `Browser is unsupported. rnbw works in the latest versions of Google Chrome and Microsoft Edge.`
      if (!window.confirm(message)) {
        return
      }
    }

    setWorkspace({ name: 'local', projects: [] })
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    window.document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }, [])
  // -------------------------------------------------------------- recent project --------------------------------------------------------------
  const [recentProjectContext, setRecentProjectContext] = useState<(TProjectContext)[]>([])
  const [recentProjectName, setRecentProjectName] = useState<(string)[]>([])
  const [recentProjectHandler, setRecentProjectHandler] = useState<(FileSystemDirectoryHandle | null)[]>([])
  const cmdkReferneceRecentProject = useMemo<TCmdkReference[]>(() => {
    const _projects: TProject[] = []
    const _cmdkReferneceRecentProject: TCmdkReference[] = []
    recentProjectContext.map((_v, index) => {
      if (_v != 'idb'){
        _projects.push({
          context: recentProjectContext[index],
          name: recentProjectName[index],
          handler: recentProjectHandler[index],
          favicon: null
        })
        _cmdkReferneceRecentProject.push({
          "Name": recentProjectName[index],
          "Icon": 'folder',
          "Description": '',
          "Keyboard Shortcut": {
            cmd: false,
            shift: false,
            alt: false,
            key: '',
            click: false,
          },
          "Group": 'Recent',
          "Context": index.toString(),
        })
      }
    })
    setWorkspace({ name: workspace.name, projects: _projects })
    return _cmdkReferneceRecentProject
  }, [recentProjectContext, recentProjectName, recentProjectHandler])
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  // key event listener
  const cb_onKeyDown = useCallback((e: KeyboardEvent) => {
    // cmdk obj for the current command
    const cmdk: TCmdkKeyMap = {
      cmd: getCommandKey(e, osType),
      shift: e.shiftKey,
      alt: e.altKey,
      key: e.code,
      click: false,
    }
    if (e.key === 'Escape') {
      closeAllPanel()
      return
    }
    if (cmdk.shift && cmdk.cmd && cmdk.key === 'KeyR') {
      onClear()
    }
    if ((cmdk.cmd && cmdk.key === 'KeyG')) {
      e.preventDefault()
      e.stopPropagation();
      // return
    }
    if (cmdkOpen) return

    // skip inline rename input in file-tree-view
    const targetId = e.target && (e.target as HTMLElement).id
    if (targetId === 'FileTreeView-RenameInput') {
      return
    }

    // skip monaco-editor shortkeys and general coding
    if (activePanel === 'code') {
      if (!(cmdk.cmd && !cmdk.shift && !cmdk.alt && cmdk.key === 'KeyS')) {
        return
      }
    }

    // detect action
    let action: string | null = null
    for (const actionName in cmdkReferenceData) {
      const _cmdk = cmdkReferenceData[actionName]['Keyboard Shortcut'] as TCmdkKeyMap

      const key = _cmdk.key.length === 0 ? ''
        : _cmdk.key === '\\' ? 'Backslash'
          : (_cmdk.key.length === 1 ? 'Key' : '') + _cmdk.key[0].toUpperCase() + _cmdk.key.slice(1)
      if (cmdk.cmd === _cmdk.cmd && cmdk.shift === _cmdk.shift && cmdk.alt === _cmdk.alt && cmdk.key === key) {
        action = actionName
        break
      }
    }
    if (action === null) return

    LogAllow && console.log('action to be run by cmdk: ', action)

    // prevent chrome default short keys
    if (action === 'Save' || action === 'Download' || action === 'Duplicate') {
      e.preventDefault()
    }

    setCurrentCommand({ action })
  }, [cmdkOpen, cmdkReferenceData, activePanel, osType])
  // bind onKeyDownCallback (cb_onKeyDown)
  useEffect(() => {
    document.addEventListener('keydown', cb_onKeyDown)
    return () => document.removeEventListener('keydown', cb_onKeyDown)
  }, [cb_onKeyDown])
  // command detect & do actions
  useEffect(() => {
    switch (currentCommand.action) {
      case 'Jumpstart':
        onJumpstart()
        break
      case 'New':
        onNew()
        // show actions panel by default
        !showActionsPanel && setShowActionsPanel(true)
        break
      case 'Open':
        onOpen()
        break
      case 'Theme':
        onToggleTheme()
        break
      case 'Clear':
        onClear()
        break
      case 'Undo':
        onUndo()
        break
      case 'Redo':
        onRedo()
        break
      case 'Actions':
        onActions()
        break
      case 'Add':
        onAdd()
        break
      case 'Code':
        toogleCodeView()
        break
      case 'Design':
        toogleActionsPanel()
        break
      case 'Guide':
        openGuidePage()
        break
      case 'Download':
        onDownload()
        break
      default:
        return
    }
  }, [currentCommand])
  // -------------------------------------------------------------- handlers --------------------------------------------------------------
  const clearSession = useCallback(() => {
    dispatch(clearMainState())
    dispatch({ type: HmsClearActionType })
  }, [])
  const loadProject = useCallback(async (fsType: TProjectContext, projectHandle?: FileSystemHandle | null, internal?: boolean | true) => {
    setFavicon('')
    if (fsType === 'local') {
      setFSPending(true)
      try {
        // configure idb on nohost
        const handlerObj = await loadLocalProject(projectHandle as FileSystemDirectoryHandle, osType)
        clearSession() /* file treeview error fix when the switching project by navigator */

        setTimeout(async () => {
          // sort by ASC directory/file
          Object.keys(handlerObj).map(uid => {
            const handler = handlerObj[uid]
            handler.children = handler.children.sort((a, b) => {
              return handlerObj[a].kind === 'file' && handlerObj[b].kind === 'directory' ? 1 :
                handlerObj[a].kind === 'directory' && handlerObj[b].kind === 'file' ? -1 :
                  handlerObj[a].name > handlerObj[b].name ? 1 : -1
            })
          })

          // get/set the index/first html to be opened by default
          let firstHtmlUid: TNodeUid = '', indexHtmlUid: TNodeUid = ''
          handlerObj[RootNodeUid].children.map(uid => {
            const handler = handlerObj[uid]
            if (handler.kind === 'file' && handler.ext === '.html') {
              firstHtmlUid === '' ? firstHtmlUid = uid : null
              handler.name === 'index' ? indexHtmlUid = uid : null
            }
          })

          // set default background
          setIFrameSrc(null)
          setNodeTree({})
          setValidNodeTree({})
          setCurrentFileUid('')
          dispatch(removeCurrentFile())

          let initialFile = indexHtmlUid !== '' ? indexHtmlUid : firstHtmlUid !== '' ? firstHtmlUid : ''
          
          // hide element panel when there is no index.html
          if (initialFile === '' ){
              setShowActionsPanel(false)
              setNavigatorDropDownType(null)
          }

          setInitialFileToOpen(initialFile)

          // set ff-tree, ff-handlers
          const treeViewData: TNodeTreeData = {}
          const ffHandlerObj: TFileHandlerCollection = {}
          Object.keys(handlerObj).map(uid => {
            const { parentUid, children, path, kind, name, ext, content, handler } = handlerObj[uid]
            const type = ParsableFileTypes[ext || ''] ? ext?.slice(1) : 'unknown'
            treeViewData[uid] = {
              uid,
              parentUid: parentUid,
              name: name,
              isEntity: kind === 'file',
              children: [...children],
              data: {
                valid: true,
                path: path,
                kind: kind,
                name: name,
                ext: ext,
                type,
                orgContent:  content?.toString(),
                content: content?.toString(),
                changed: false,
              } as TFileNodeData,
            } as TNode

            ffHandlerObj[uid] = handler
          })

          setFFTree(treeViewData)
          setFFHandlers(ffHandlerObj)

          setProject({ context: 'local', name: (projectHandle as FileSystemDirectoryHandle).name, handler: projectHandle as FileSystemDirectoryHandle, favicon: null })
          setNavigatorDropDownType(null)
          if (internal) {
            // store last edit session
            const _recentProjectContext = [...recentProjectContext]
            const _recentProjectName = [...recentProjectName]
            const _recentProjectHandler = [...recentProjectHandler]
            for (let index = 0; index < _recentProjectContext.length; ++index) {
              if (_recentProjectContext[index] === fsType && projectHandle?.name === _recentProjectName[index]) {
                _recentProjectContext.splice(index, 1)
                _recentProjectName.splice(index, 1)
                _recentProjectHandler.splice(index, 1)
                break
              }
            }
            if (_recentProjectContext.length === RecentProjectCount) {
              _recentProjectContext.pop()
              _recentProjectName.pop()
              _recentProjectHandler.pop()
            }
            _recentProjectContext.unshift(fsType)
            _recentProjectName.unshift((projectHandle as FileSystemDirectoryHandle).name)
            _recentProjectHandler.unshift(projectHandle as FileSystemDirectoryHandle)
            setRecentProjectContext(_recentProjectContext)
            setRecentProjectName(_recentProjectName)
            setRecentProjectHandler(_recentProjectHandler)
            await setMany([['recent-project-context', _recentProjectContext], ['recent-project-name', _recentProjectName], ['recent-project-handler', _recentProjectHandler]])
          }

          // show actions panel by default
          !showActionsPanel && setShowActionsPanel(true)
        }, 50)
      } catch (err) {
        LogAllow && console.log('failed to load local project')
      }
      setFSPending(false)
    } else if (fsType === 'idb') {
      setFSPending(true)
      clearSession()
      try {
        const handlerObj = await loadIDBProject(DefaultProjectPath)

        // sort by ASC directory/file
        Object.keys(handlerObj).map(uid => {
          const handler = handlerObj[uid]
          handler.children = handler.children.sort((a, b) => {
            return handlerObj[a].kind === 'file' && handlerObj[b].kind === 'directory' ? 1 :
              handlerObj[a].kind === 'directory' && handlerObj[b].kind === 'file' ? -1 :
                handlerObj[a].name > handlerObj[b].name ? 1 : -1
          })
        })

        // get/set the index/first html to be opened by default
        let firstHtmlUid: TNodeUid = '', indexHtmlUid: TNodeUid = ''
        handlerObj[RootNodeUid].children.map(uid => {
          const handler = handlerObj[uid]
          if (handler.kind === 'file' && handler.ext === '.html') {
            firstHtmlUid === '' ? firstHtmlUid = uid : null
            handler.name === 'index' ? indexHtmlUid = uid : null
          }
        })
        setInitialFileToOpen(indexHtmlUid !== '' ? indexHtmlUid : firstHtmlUid !== '' ? firstHtmlUid : '')

        // set ff-tree, ff-handlers
        const treeViewData: TNodeTreeData = {}
        const ffHandlerObj: TFileHandlerCollection = {}
        Object.keys(handlerObj).map(uid => {
          const { parentUid, children, path, kind, name, ext, content } = handlerObj[uid]
          const type = ParsableFileTypes[ext || ''] ? ext?.slice(1) : 'unknown'
          treeViewData[uid] = {
            uid,
            parentUid: parentUid,
            name: name,
            isEntity: kind === 'file',
            children: [...children],
            data: {
              valid: true,
              path: path,
              kind: kind,
              name: name,
              ext: ext,
              type,
              orgContent: type !== 'unknown' ? content?.toString() : '',
              content: type !== 'unknown' ? content?.toString() : '',
              changed: false,
            } as TFileNodeData,
          } as TNode
        })
        setFFTree(treeViewData)
        setFFHandlers(ffHandlerObj)
        setProject({ context: 'idb', name: 'Untitled', handler: null, favicon: null })
        
        // store last edit session
        // const _recentProjectContext = [...recentProjectContext]
        // const _recentProjectName = [...recentProjectName]
        // const _recentProjectHandler = [...recentProjectHandler]
        // for (let index = 0; index < _recentProjectContext.length; ++index) {
        //   if (_recentProjectContext[index] === fsType) {
        //     _recentProjectContext.splice(index, 1)
        //     _recentProjectName.splice(index, 1)
        //     _recentProjectHandler.splice(index, 1)
        //     break
        //   }
        // }
        // if (_recentProjectContext.length === RecentProjectCount) {
        //   _recentProjectContext.pop()
        //   _recentProjectName.pop()
        //   _recentProjectHandler.pop()
        // }
        // _recentProjectContext.unshift(fsType)
        // _recentProjectName.unshift('Untitled')
        // _recentProjectHandler.unshift(null)
        // setRecentProjectContext(_recentProjectContext)
        // setRecentProjectName(_recentProjectName)
        // setRecentProjectHandler(_recentProjectHandler)
        // await setMany([['recent-project-context', _recentProjectContext], ['recent-project-name', _recentProjectName], ['recent-project-handler', _recentProjectHandler]])
      } catch (err) {
        LogAllow && console.log('failed to load Untitled project')
      }
      setFSPending(false)
    }    
  }, [clearSession, osType, recentProjectContext, recentProjectName, recentProjectHandler, ffTree])
  const onImportProject = useCallback(async (fsType: TProjectContext = 'local'): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      if (fsType === 'local') {
        try {
          const projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
          await loadProject(fsType, projectHandle, true)
        } catch (err) {
          reject(err)
        }
      } else if (fsType === 'idb') {
        try {
          await loadProject(fsType, null, true)
        } catch (err) {
          reject(err)
        }
      }
      resolve()
    })
  }, [loadProject])
  // open
  const onOpen = useCallback(async () => {
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
    setFSPending(true)

    try {
      await onImportProject()
    } catch (err) {
      LogAllow && console.log('failed to open project')
    }

    setFSPending(false)
  }, [onImportProject, ffTree])
  // new
  const onNew = useCallback(async () => {
    if (ffTree) {
      // confirm if ffTree is changed
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
    setFSPending(true)

    // init/open Untitled project
    try {
      await initIDBProject(DefaultProjectPath)
      await onImportProject('idb')
    } catch (err) {
      LogAllow && console.log('failed to init/load Untitled project')
    }

    setFSPending(false)
  }, [onImportProject, ffTree])
  // actions
  const onActions = useCallback(() => {
    if (cmdkOpen) return
    setCmdkPages(['Actions'])
    setCmdkOpen(true)
  }, [cmdkOpen])
  // add
  const onAdd = useCallback(() => {
    setCmdkPages([...cmdkPages, 'Add'])
    setCmdkOpen(true)
  }, [cmdkPages])
  // download
  const onDownload = useCallback(async () => {
    if (project.context !== 'idb') return

    try {
      await downloadProject(DefaultProjectPath)
    } catch (err) {
      LogAllow && console.log('failed to download project')
    }
  }, [project.context])
  // clear
  const onClear = useCallback(async () => {
    // remove localstorage and session
    window.localStorage.clear()
    await delMany(['recent-project-context', 'recent-project-name', 'recent-project-handler'])
  }, [])
  // jumpstart
  const onJumpstart = useCallback(() => {
    if (cmdkOpen) return
    setCmdkPages(['Jumpstart'])
    setCmdkOpen(true)
  }, [cmdkOpen])

  // open navigator when close the menu
  useEffect(() => {
    if (!cmdkOpen && firstLoaded.current == 2 && !showActionsPanel){
      setShowActionsPanel(true)
    }
    firstLoaded.current ++
  }, [cmdkOpen])

  // close all panel
  const closeAllPanel = useCallback(() => {
    setShowCodeView(false)
    setShowActionsPanel(false)
  }, [])
  // hms
  const onUndo = useCallback(() => {
    if (pending || iframeLoading || fsPending || codeEditing || !parseFileFlag) return

    LogAllow && pastLength === 1 && console.log('hms - it is the origin state')
    if (pastLength === 1) return

    setCurrentFileUid(file.uid)
    setIsHms(true)

    dispatch({ type: 'main/undo' })
    setUpdateOpt({ parse: true, from: 'hms' })
  }, [pending, iframeLoading, fsPending, codeEditing, pastLength, fileAction, file.uid])
  const onRedo = useCallback(() => {
    if (pending || iframeLoading || fsPending || codeEditing  || !parseFileFlag) return

    LogAllow && futureLength === 0 && console.log('hms - it is the latest state')
    if (futureLength === 0) return

    setFFAction(fileAction)
    setCurrentFileUid(file.uid)
    setIsHms(false)

    dispatch({ type: 'main/redo' })
    setUpdateOpt({ parse: true, from: 'hms' })
  }, [pending, iframeLoading, fsPending, codeEditing, futureLength, file.uid])
  useEffect(() => {
    // reset fileAction in the new history
    futureLength === 0 && fileAction.type !== null && dispatch(setFileAction({ type: null }))
  }, [actionGroupIndex])
  // toogle code view
  const [showCodeView, setShowCodeView] = useState(false)
  const toogleCodeView = useCallback(() => {
    setShowCodeView(!showCodeView)
    setNewFocusedNodeUid(fnFocusedItem)
  }, [showCodeView, fnFocusedItem])
  // toogle actions panel
  const toogleActionsPanel = useCallback(() => {
    setShowActionsPanel(!showActionsPanel)
  }, [showActionsPanel])
  // open guide page
  const openGuidePage = useCallback(() => {
    window.open('https://guide.rnbw.dev', '_blank', 'noreferrer');
  }, [currentCommand])
  // -------------------------------------------------------------- pos/size for panels --------------------------------------------------------------
  const [actionsPanelOffsetTop, setActionsPanelOffsetTop] = useState(12)
  const [actionsPanelOffsetLeft, setActionsPanelOffsetLeft] = useState(12)
  const [actionsPanelWidth, setActionsPanelWidth] = useState(240)

  const [codeViewOffsetBottom, setCodeViewOffsetBottom] = useState('12')
  const [codeViewOffsetTop, setCodeViewOffsetTop] = useState('calc(60vh - 12px)')
  const [codeViewOffsetLeft, setCodeViewOffsetLeft] = useState(12)
  const [codeViewHeight, setCodeViewHeight] = useState("40")
  const [codeViewDragging, setCodeViewDragging] = useState(false)
  // -------------------------------------------------------------- other --------------------------------------------------------------
  // detect OS & fetch reference - html. Jumpstart.csv, Actions.csv - restore recent project session - open Untitled project and jumpstart menu ons tartup
  useEffect(() => {
    (async () => {
      addRunningActions(['detect-os', 'reference-files', 'reference-html-elements', 'reference-cmdk-jumpstart', 'reference-cmdk-actions'])

      // detect os
      LogAllow && console.log('navigator: ', navigator.userAgent)
      if (navigator.userAgent.indexOf('Mac OS X') !== -1) {
        setOsType('Mac')
      } else if (navigator.userAgent.indexOf('Linux') !== -1) {
        setOsType('Linux')
      } else {
        setOsType('Windows')
      }

      // reference-files
      const _filesReferenceData: TFilesReferenceData = {}
      filesRef.map((fileRef: TFilesReference) => {
        _filesReferenceData[fileRef.Extension] = fileRef
      })
      setFilesReferenceData(_filesReferenceData)
      LogAllow && console.log('files reference data: ', _filesReferenceData)

      // reference-html-elements
      const htmlElementsReferenceData: THtmlElementsReferenceData = {}
      htmlRefElements.map((htmlRefElement: THtmlElementsReference) => {
        const pureTag = htmlRefElement['Name'] === 'Comment' ? 'comment' : htmlRefElement['Tag']?.slice(1, htmlRefElement['Tag'].length - 1)
        htmlElementsReferenceData[pureTag] = htmlRefElement
      })
      LogAllow && console.log('html elements reference data: ', htmlElementsReferenceData)

      // set html reference
      setHtmlReferenceData({ elements: htmlElementsReferenceData })

      // add default cmdk actions
      const _cmdkReferenceData: TCmdkReferenceData = {}
      // clear
      _cmdkReferenceData['Clear'] = {
        "Name": 'Clear',
        "Icon": '',
        "Description": '',
        "Keyboard Shortcut": {
          cmd: true,
          shift: true,
          alt: false,
          key: 'KeyR',
          click: false,
        },
        "Group": 'default',
        "Context": 'all',
      }
      // Jumpstart
      _cmdkReferenceData['Jumpstart'] = {
        "Name": 'Jumpstart',
        "Icon": '',
        "Description": '',
        "Keyboard Shortcut": {
          cmd: false,
          shift: false,
          alt: false,
          key: 'KeyJ',
          click: false,
        },
        "Group": 'default',
        "Context": 'all',
      }
      // Actions
      _cmdkReferenceData['Actions'] = {
        "Name": 'Actions',
        "Icon": '',
        "Description": '',
        "Keyboard Shortcut": {
          cmd: false,
          shift: false,
          alt: false,
          key: 'KeyW',
          click: false,
        },
        "Group": 'default',
        "Context": 'all',
      }
      // File Save
      _cmdkReferenceData['Save'] = {
        "Name": 'Save',
        "Icon": '',
        "Description": '',
        "Keyboard Shortcut": {
          cmd: true,
          shift: false,
          alt: false,
          key: 'KeyS',
          click: false,
        },
        "Group": 'default',
        "Context": 'all',
      }

      // reference-cmdk-jumpstart
      const _cmdkRefJumpstartData: TCmdkGroupData = {}
      await Promise.all(cmdkRefJumpstart.map(async (command: TCmdkReference) => {
        const keys: string[] = (command["Keyboard Shortcut"] as string)?.replace(/ /g, "").split('+')
        const keyObj: TCmdkKeyMap = {
          cmd: false,
          shift: false,
          alt: false,
          key: '',
          click: false,
        }
        keys?.map((key) => {
          if (key === 'cmd' || key === 'shift' || key === 'alt' || key === 'click') {
            keyObj[key] = true
          } else {
            keyObj.key = key
          }
        })

        const _command: TCmdkReference = JSON.parse(JSON.stringify(command))
        _command['Keyboard Shortcut'] = keyObj

        const groupName = _command['Group']
        if (_cmdkRefJumpstartData[groupName] !== undefined) {
          _cmdkRefJumpstartData[groupName].push(_command)
        } else {
          _cmdkRefJumpstartData[groupName] = [_command]
        }
        if (groupName === 'Projects' && _cmdkRefJumpstartData['Recent'] === undefined) {
          _cmdkRefJumpstartData['Recent'] = []
          // restore last edit session
          try {
            const sessionInfo = await getMany(['recent-project-context', 'recent-project-name', 'recent-project-handler'])
            if (sessionInfo[0] && sessionInfo[1] && sessionInfo[2]) {
              const _session: TSession = {
                'recent-project-context': sessionInfo[0],
                'recent-project-name': sessionInfo[1],
                'recent-project-handler': sessionInfo[2],
              }
              setRecentProjectContext(_session['recent-project-context'])
              setRecentProjectName(_session['recent-project-name'])
              setRecentProjectHandler(_session['recent-project-handler'])

              for (let index = 0; index < _session['recent-project-context'].length; ++index) {
                const _recentProjectCommand = {
                  "Name": _session['recent-project-name'][index],
                  "Icon": 'folder',
                  "Description": '',
                  "Keyboard Shortcut": {
                    cmd: false,
                    shift: false,
                    alt: false,
                    key: '',
                    click: false,
                  },
                  "Group": 'Recent',
                  "Context": index.toString(),
                } as TCmdkReference
                _cmdkRefJumpstartData['Recent'].push(_recentProjectCommand)
              }
              LogAllow && console.log('last session loaded', _session);
            } else {
              LogAllow && console.log('has no last session')
            }
          } catch (err) {
            LogAllow && console.log('failed to load last session')
          }
        }

        _cmdkReferenceData[_command['Name']] = _command
      }))

      // if (_cmdkRefJumpstartData['Recent'].length === 0) {
      //   delete _cmdkRefJumpstartData['Recent']
      // }
      setCmdkReferenceJumpstart(_cmdkRefJumpstartData)
      LogAllow && console.log('cmdk jumpstart reference data: ', _cmdkRefJumpstartData)

      // reference-cmdk-actions
      const _cmdkRefActionsData: TCmdkGroupData = {}
      cmdkRefActions.map((command: TCmdkReference) => {
        const contexts: TCmdkContextScope[] = (command['Context'] as string)?.replace(/ /g, "").split(',').map((scope: string) => scope as TCmdkContextScope)
        const contextObj: TCmdkContext = {
          "all": false,
          "file": false,
          "html": false,
        }
        contexts?.map((context: TCmdkContextScope) => {
          contextObj[context] = true
        })

        const keys: string[] = (command["Keyboard Shortcut"] as string)?.replace(/ /g, "").split('+')
        const keyObj: TCmdkKeyMap = {
          cmd: false,
          shift: false,
          alt: false,
          key: '',
          click: false,
        }
        keys?.map((key: string) => {
          if (key === 'cmd' || key === 'shift' || key === 'alt' || key === 'click') {
            keyObj[key] = true
          } else {
            keyObj.key = key
          }
        })

        const _command: TCmdkReference = JSON.parse(JSON.stringify(command))
        _command['Context'] = contextObj
        _command['Keyboard Shortcut'] = keyObj

        const groupName = _command['Group']
        if (_cmdkRefActionsData[groupName] !== undefined) {
          _cmdkRefActionsData[groupName].push(_command)
        } else {
          _cmdkRefActionsData[groupName] = [_command]
        }

        _cmdkReferenceData[_command['Name']] = _command
      })
      setCmdkReferenceActions(_cmdkRefActionsData)
      LogAllow && console.log('cmdk actions reference data: ', _cmdkRefActionsData)

      // set cmdk map
      setCmdkReferenceData(_cmdkReferenceData)
      LogAllow && console.log('cmdk map: ', _cmdkReferenceData)

      removeRunningActions(['detect-os', 'reference-files', 'reference-html-elements', 'reference-cmdk-jumpstart', 'reference-cmdk-actions'], false)
    })()
  }, [])
  const [openDefaultProject, setOpenDefaultProject] = useState(false)
  useEffect(() => {
    // wait until "cmdkReferenceJumpstart" is ready
    Object.keys(cmdkReferenceJumpstart).length !== 0 && onJumpstart()
  }, [cmdkReferenceJumpstart])
  // newbie flag
  useEffect(() => {
    const isNewbie = localStorage.getItem("newbie")
    LogAllow && console.log('isNewbie: ', isNewbie === null ? true : false)
    if (!isNewbie) {
      localStorage.setItem("newbie", 'false');
      // init/open Untitled project
      (async () => {
        setFSPending(true)
        try {
          await initIDBProject(DefaultProjectPath)
          await onImportProject('idb')
          LogAllow && console.log('inited/loaded Untitled project')
        } catch (err) {
          LogAllow && console.log('failed to init/load Untitled project')
        }
        setFSPending(false)
      })()
    }
    // always show default project when do refresh
    else{
      onNew()
    }

    // set initial codeview height & offset
    // const offsetTop = localStorage.getItem("offsetTop")
    // const codeViewHeight = localStorage.getItem("codeViewHeight")
    // if (offsetTop) {
    //   setCodeViewOffsetTop(offsetTop)
    // }
    // else {
    //   setCodeViewOffsetTop('66')
    // }

  }, [])
  // theme
  const setSystemTheme = useCallback(() => {
    setTheme('System')
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.setAttribute("data-theme", "light")
    }
  }, [])
  const onToggleTheme = useCallback(() => {
    switch (theme) {
      case "System":
        document.documentElement.setAttribute("data-theme", "light")
        localStorage.setItem("theme", "light")
        setTheme('Light')
        break
      case "Light":
        document.documentElement.setAttribute("data-theme", "dark")
        localStorage.setItem("theme", "dark")
        setTheme('Dark')
        break
      case "Dark":
        document.documentElement.removeAttribute("data-theme")
        localStorage.removeItem("theme")
        setSystemTheme()
        break
      default:
        break
    }
  }, [theme, setSystemTheme])
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    LogAllow && console.log('storedTheme: ', storedTheme)
    if (storedTheme) {
      document.documentElement.setAttribute("data-theme", storedTheme)
      setTheme(storedTheme === 'dark' ? 'Dark' : 'Light')
    } else {
      setSystemTheme()
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", setSystemTheme)
    }

    return () => window.matchMedia("(prefers-color-scheme: dark)").removeEventListener('change', setSystemTheme)
  }, [])
  // web-tab close event handler
  useEffect(() => {
    let changed = false

    const uids = Object.keys(ffTree)
    for (const uid of uids) {
      const node = ffTree[uid]
      const nodeData = node.data as TFileNodeData

      if (nodeData.changed) {
        changed = true
        break
      }
    }

    window.onbeforeunload = changed ? () => {
      return 'changed'
    } : null

    return () => {
      window.onbeforeunload = null
    }
  }, [ffTree])
  // cmdk modal handle
  const [hoveredMenuItemDescription, setHoverMenuItemDescription] = useState<string | null | undefined>()
  const [validMenuItemCount, setValidMenuItemCount] = useState<number>()
  useEffect(() => {
    let hoveredMenuItemDetecter: NodeJS.Timer
    if (cmdkOpen) {
      // detect hovered menu item in cmdk modal if its open
      hoveredMenuItemDetecter = setInterval(() => {
        const menuItems = document.querySelectorAll('.rnbw-cmdk-menu-item')
        setValidMenuItemCount(menuItems.length)

        const description = cmdkPage === 'Add' || cmdkPage === 'Jumpstart' ? document.querySelector('.rnbw-cmdk-menu-item[aria-selected="true"]')?.getAttribute('rnbw-cmdk-menu-item-description') : ''
        setHoverMenuItemDescription(description)
      }, 10)
    } else {
      // clear cmdk pages and search text when close the modal
      setCmdkPages([])
      setCmdkSearch('')
      // setValidMenuItemCount(undefined)
    }

    return () => clearInterval(hoveredMenuItemDetecter)
  }, [cmdkOpen])
  // file changed - reload the monaco-editor to clear history
  const [needToReloadCodeView, setNeedToReloadCodeView] = useState(false)
  useEffect(() => {
    setNeedToReloadCodeView(true)
  }, [file.uid])
  useEffect(() => {
    setNeedToReloadCodeView(false)
  }, [needToReloadCodeView])


  // drag & dragend code view event
  const dragCodeView = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setCodeViewOffsetTop((e.clientY / document.documentElement.clientHeight * 100 < 1 ? 1 : e.clientY / document.documentElement.clientHeight * 100).toString())
    if (!codeViewDragging) {
      setCodeViewDragging(true)
    }
  }, [])

  const dragEndCodeView = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const offsetTop = (e.clientY / document.documentElement.clientHeight * 100 < 1 ? 1 : e.clientY / document.documentElement.clientHeight * 100).toString()
    setCodeViewOffsetTop(offsetTop)
    setCodeViewDragging(false)
    localStorage.setItem('offsetTop', offsetTop)
  }, [])

  const dropCodeView = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()    
  }, [])
  // close navigator
  const onCloseDropDown = useCallback(() => {
    navigatorDropDownType !== null && setNavigatorDropDownType(null)
  }, [navigatorDropDownType])

  return <>
    {/* wrap with the context */}
    <MainContext.Provider
      value={{
        // global action
        addRunningActions, removeRunningActions,
        // navigator
        workspace, setWorkspace,
        project,
        navigatorDropDownType,
        setNavigatorDropDownType,
        // node actions
        activePanel, setActivePanel,
        clipboardData, setClipboardData,
        event, setEvent,
        favicon, setFavicon,
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
        // code view
        showCodeView, setShowCodeView,
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
        setCodeViewOffsetTop,
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
        // load project
        loadProject,
        // non html editable
        parseFileFlag, setParseFile,
        prevFileUid, setPrevFileUid,
        // close all panel
        closeAllPanel
      }}
    >
      {/* process */}
      <Process />

      {/* spinner */}
      {/* <Loader show={pending}></Loader> */}

      {/* main page */}
      <div
        id='MainPage'
        className={'view background-primary'}
        style={{ display: 'relative' }}
        onClick={onCloseDropDown}
      >
        <StageView />
        <ActionsPanel
          offsetTop={actionsPanelOffsetTop}
          offsetLeft={actionsPanelOffsetLeft}
          width={`${actionsPanelWidth}px`}
          height={`calc(100vh - ${actionsPanelOffsetTop * 2}px)`}
        />
        {showCodeView && !needToReloadCodeView ?
          <CodeView
            offsetTop={`${codeViewOffsetTop}`}
            offsetBottom={codeViewOffsetBottom}
            offsetLeft={showActionsPanel ? actionsPanelOffsetLeft * 2 + actionsPanelWidth : codeViewOffsetLeft}
            width={`calc(100vw - ${(showActionsPanel ? actionsPanelWidth + actionsPanelOffsetLeft * 2 : codeViewOffsetLeft) + codeViewOffsetLeft}px)`}
            height={`${codeViewHeight}vh`}
            dropCodeView={dropCodeView}
            dragCodeView={dragCodeView}
            dragEndCodeView={dragEndCodeView}
            codeViewDragging={codeViewDragging}
          /> : null}
      </div>

      {/* cmdk modal */}
      <Command.Dialog
        open={cmdkOpen}
        className='background-primary radius-s shadow border'
        onOpenChange={setCmdkOpen}
        onKeyDown={(e: React.KeyboardEvent) => {
          // cmdk obj for the current command
          const cmdk: TCmdkKeyMap = {
            cmd: getCommandKey(e as unknown as KeyboardEvent, osType),
            shift: e.shiftKey,
            alt: e.altKey,
            key: e.code,
            click: false,
          }
          if (cmdk.shift && cmdk.cmd && cmdk.key === 'KeyR') {
            onClear()
          }
          if (e.code === 'Escape' || (e.code === 'Backspace' && !cmdkSearch)) {
            if (e.code === 'Escape' && cmdkPages.length === 1) {
              setCmdkPages([])
              setCmdkOpen(false)
            } else {
              cmdkPages.length !== 1 && setCmdkPages((cmdkPages) => cmdkPages.slice(0, -1))
            }
          }
          e.stopPropagation()
        }}
        filter={(value: string, search: string) => {
          return value.includes(search) !== false ? 1 : 0
        }}
        loop={true}
        label={cmdkPage}
      >
        {/* search input */}
        <div className={cx(
          'gap-m box-l padding-m justify-start',
          validMenuItemCount === 0 ? '' : 'border-bottom',
        )}>
          <Command.Input
            value={cmdkSearch}
            onValueChange={setCmdkSearch}
            className='justify-start padding-s gap-s text-l background-primary'
            placeholder={cmdkPage === 'Jumpstart' ? 'Jumpstart...' :
              cmdkPage === 'Actions' ? 'Do something...' :
                cmdkPage === 'Add' ? 'Add something...' : ''} />
        </div>

        {/* modal content */}
        <div
          className={cmdkPage !== 'Add' && cmdkPage !== 'Jumpstart' ? "" : "box-l direction-column align-stretch box"}
          style={{
            ...(cmdkPage !== 'Add' && cmdkPage !== 'Jumpstart' ? { width: "100%" } : {}),
            ...(validMenuItemCount === 0 ? { height: '0px', overflow: 'hidden' } : {}),
          }}
        >
          {/* menu list - left panel */}
          <div className="padding-m box">
            <div className="direction-row align-stretch">
              <Command.List style={{ maxHeight: "600px", overflow: "auto", width: '100%' }}>
                {/* <Command.Loading>Fetching commands reference data...</Command.Loading> */}

                {/* <Command.Empty>No results found for "{cmdkSearch}".</Command.Empty> */}

                {Object.keys(cmdkPage === 'Jumpstart' ? cmdkReferenceJumpstart :
                  cmdkPage === 'Actions' ? cmdkReferenceActions :
                    cmdkPage === 'Add' ? cmdkReferenceAdd : {}
                ).map((groupName: string) => {
                  let groupNameShow: boolean = false;
                  (cmdkPage === 'Jumpstart' ? (groupName !== 'Recent' ? cmdkReferenceJumpstart[groupName] : cmdkReferneceRecentProject) :
                      cmdkPage === 'Actions' ? cmdkReferenceActions[groupName] :
                        cmdkPage === 'Add' ? cmdkReferenceAdd[groupName] : []
                    ).map((command: TCmdkReference) => {
                      const context: TCmdkContext = (command.Context as TCmdkContext)
                      groupNameShow = (
                        (cmdkPage === 'Jumpstart') ||
                        (cmdkPage === 'Actions' && (
                          (command.Name === 'Add') ||
                          (context.all === true) ||
                          (activePanel === 'file' && (
                            (context['file'] === true) ||
                            (false)
                          )) ||
                          ((activePanel === 'node' || activePanel === 'stage') && (
                            (ffTree[file.uid] && (ffTree[file.uid].data as TFileNodeData).type === 'html' && context['html'] === true) ||
                            (false)
                          ))
                        )) ||
                        (cmdkPage === 'Add')
                      )
                    })
                  
                  return <Command.Group
                    key={groupName}
                    // heading={groupName}
                    value={groupName}
                  >
                    
                    {/* group heading label */}
                    {groupNameShow ? 
                      <div className="padding-m gap-s">
                        <span className="text-s opacity-m">{groupName}</span>
                      </div> : <></>
                    }
                    {(cmdkPage === 'Jumpstart' ? (groupName !== 'Recent' ? cmdkReferenceJumpstart[groupName] : cmdkReferneceRecentProject) :
                      cmdkPage === 'Actions' ? cmdkReferenceActions[groupName] :
                        cmdkPage === 'Add' ? cmdkReferenceAdd[groupName] : []
                    ).map((command: TCmdkReference, index) => {
                      const context: TCmdkContext = (command.Context as TCmdkContext)
                      const show: boolean = (
                        (cmdkPage === 'Jumpstart') ||
                        (cmdkPage === 'Actions' && (
                          (command.Name === 'Add') ||
                          (context.all === true) ||
                          (activePanel === 'file' && (
                            (context['file'] === true) ||
                            (false)
                          )) ||
                          ((activePanel === 'node' || activePanel === 'stage') && (
                            (ffTree[file.uid] && (ffTree[file.uid].data as TFileNodeData).type === 'html' && context['html'] === true) ||
                            (false)
                          ))
                        )) ||
                        (cmdkPage === 'Add')
                      )

                      return show ?
                        <Command.Item
                          key={`${command.Name}-${command.Context}-${index}`}
                          value={command.Name + index}
                          className='rnbw-cmdk-menu-item'
                          {...{ 'rnbw-cmdk-menu-item-description': command.Description }}
                          onSelect={() => {
                            // keep modal open when toogling theme or go "Add" menu from "Actions" menu
                            command.Name !== 'Theme' && command.Name !== 'Add' && setCmdkOpen(false)
                            if (command.Name === 'Guide') {
                              guideRef.current?.click()
                            } else if (command.Group === 'Add') {
                              setCurrentCommand({ action: `${AddActionPrefix}-${command.Context}` })
                            } else if (cmdkPage === 'Jumpstart' && command.Group === 'Recent') {
                              const index = Number(command.Context)
                              const projectContext = recentProjectContext[index]
                              const projectHandler = recentProjectHandler[index]
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
                              loadProject(projectContext, projectHandler, true)
                            } else if (cmdkPage === 'Add' && command.Group === 'Recent') {
                            } else {
                              setCurrentCommand({ action: command.Name })
                            }
                          }}
                        >
                          <div className='justify-stretch padding-s align-center'>
                            <div className="gap-s align-center">
                              {/* detect Theme Group and render check boxes */}
                              {cmdkPage === 'Jumpstart' && command.Name === 'Theme' ?
                                <>
                                  <div className="padding-xs">
                                    <div className="radius-m icon-xs align-center background-tertiary"></div>
                                  </div>
                                  <div className="gap-s align-center">
                                    <span className="text-m opacity-m">Theme</span>
                                    <span className="text-s opacity-m">/</span>
                                    <span className="text-m">{theme}</span>
                                  </div>
                                </> : <>
                                  <div className="padding-xs">
                                    {typeof command.Icon === 'string' && command['Icon'] !== '' ?
                                      <SVGIcon {...{ "class": "icon-xs" }}>{command['Icon']}</SVGIcon> :
                                      <div className='icon-xs'></div>}
                                  </div>
                                  <span className="text-m">{command['Name']}</span>
                                </>}
                            </div>
                            <div className="gap-s">
                              {(command['Keyboard Shortcut'] as TCmdkKeyMap).cmd && <span className="text-m">⌘</span>}
                              {(command['Keyboard Shortcut'] as TCmdkKeyMap).shift && <span className="text-m">⇧</span>}
                              {(command['Keyboard Shortcut'] as TCmdkKeyMap).alt && <span className="text-m">Alt</span>}
                              {command['Keyboard Shortcut'] !== undefined && (command['Keyboard Shortcut'] as TCmdkKeyMap).key !== '' && <span className="text-m">
                                {(command['Keyboard Shortcut'] as TCmdkKeyMap).key[0].toUpperCase() + (command['Keyboard Shortcut'] as TCmdkKeyMap).key.slice(1)}
                              </span>}
                              {(command['Keyboard Shortcut'] as TCmdkKeyMap).click && <span className="text-m">Click</span>}
                            </div>
                          </div>
                        </Command.Item> : null
                    }
                    )}
                  </Command.Group>
                }
                )}
              </Command.List>
            </div>
          </div>
          {/* Guide link */}
          <a style={{'display' : 'none'}} href='https://guide.rnbw.dev' target='_blank' ref={guideRef}></a>
          {/* description - right panel */}
          {(cmdkPage === 'Add' || cmdkPage === 'Jumpstart') && false &&
            <div className={cx(
              "box align-center border-left padding-l text-l",
              !!hoveredMenuItemDescription ? '' : 'opacity-m',
            )}>
              {!!hoveredMenuItemDescription ? hoveredMenuItemDescription : 'Description'}
            </div>}
        </div>
      </Command.Dialog>
    </MainContext.Provider>
  </>
}