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
  set,
} from 'idb-keyval';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import {
  useLocation,
  useParams,
} from 'react-router-dom';
import Split from 'react-split';

import {
  Loader,
  SVGIcon,
} from '@_components/common';
import {
  ActionsPanel,
  CodeView,
  Process,
  StageView,
} from '@_components/main';
import {
  AddNodeActionPrefix,
  DefaultProjectPath,
  DefaultTabSize,
  HmsClearActionType,
  LogAllow,
  ParsableFileTypes,
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
  setFileAction,
  setProjectContext,
  TCommand,
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
  TProjectContext,
  TSession,
} from '@_types/main';

import { getCommandKey } from '../../services/global';
import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  // -------------------------------------------------------------- redux  --------------------------------------------------------------
  const dispatch = useDispatch()
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { focusedItem: ffFocusedItem, expandedItems: ffExpandedItems, selectedItems: ffSelectedItems, expandedItemsObj: ffExpandedItemsObj, selectedItemsObj: ffSelectedItemsObj } = useSelector(ffSelector)
  const { focusedItem: fnFocusedItem, expandedItems: fnExpandedItems, selectedItems: fnSelectedItems, expandedItemsObj: fnExpandedItemsObj, selectedItemsObj: fnSelectedItemsObj } = useSelector(fnSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)
  // -------------------------------------------------------------- main context --------------------------------------------------------------
  // global action
  const [pending, setPending] = useState<boolean>(false)
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

    LogAllow && console.log('remove running actions', actionNames, effect)

    if (noRunningAction()) {
      LogAllow && effect && console.log('hms added')
      setPending(false)
      effect && dispatch(increaseActionGroupIndex())
    }
  }, [noRunningAction, file.content])
  // node actions
  const [activePanel, setActivePanel] = useState<TPanelContext>('unknown')
  const [clipboardData, setClipboardData] = useState<TClipboardData>({ panel: 'unknown', type: null, uids: [] })
  const [event, setEvent] = useState<TEvent>(null)
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
  // cmdk
  const [currentCommand, setCurrentCommand] = useState<TCommand>({ action: '' })
  const [cmdkOpen, setCmdkOpen] = useState<boolean>(false)
  const [cmdkPages, setCmdkPages] = useState<string[]>([])
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

    if (activePanel === 'file') {
      // validate
      const node = ffTree[ffFocusedItem]
      if (node && !node.isEntity) {
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
            "Context": fileRef.Extension,
          })
        })
        data['Files'] = data['Files'].filter((element) => element.Featured || !!cmdkSearch)
      }
    } else if (activePanel === 'node' || activePanel === 'stage') {
      // validate
      const node = nodeTree[fnFocusedItem]
      if (node && node.parentUid && node.parentUid !== RootNodeUid) {
        const parentNode = nodeTree[node.parentUid as TNodeUid]
        const refData = htmlReferenceData.elements[parentNode.name]
        if (refData) {
          if (refData.Contain === 'All') {
            Object.keys(htmlReferenceData.elements).map((tag: string) => {
              const tagRef = htmlReferenceData.elements[tag]
              data['Elements'].push({
                "Featured": tagRef.Featured === 'Yes',
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
                "Context": tagRef.Tag,
              })
            })
          } else if (refData.Contain === 'None') {
            // do nothing
          } else {
            const tagList = refData.Contain.replace(/ /g, '').split(',')
            tagList.map((tag: string) => {
              const pureTag = tag.slice(1, tag.length - 1)
              const tagRef = htmlReferenceData.elements[pureTag]

              data['Elements'].push({
                "Featured": tagRef.Featured === 'Yes',
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
                "Context": tagRef.Tag,
              })
            })
          }
          data['Elements'] = data['Elements'].filter((element) => element.Featured || !!cmdkSearch)
        }
      }
    }

    return data
  }, [activePanel, ffTree, ffFocusedItem, nodeTree, fnFocusedItem, htmlReferenceData, cmdkSearch])
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
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  // key event listener
  const cb_onKeyDown = useCallback((e: KeyboardEvent) => {
    // skip inline rename input in file-tree-view
    const targetId = e.target && (e.target as HTMLElement).id
    if (targetId === 'FileTreeView-RenameInput') {
      return
    }

    // cmdk obj for the current command
    const cmdk: TCmdkKeyMap = {
      cmd: getCommandKey(e, osType),
      shift: e.shiftKey,
      alt: e.altKey,
      key: e.code,
      click: false,
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

      const key = _cmdk.key.length === 0 ? '' : (_cmdk.key.length === 1 ? 'Key' : '') + _cmdk.key[0].toUpperCase() + _cmdk.key.slice(1)
      if (cmdk.cmd === _cmdk.cmd && cmdk.shift === _cmdk.shift && cmdk.alt === _cmdk.alt && cmdk.key === key) {
        action = actionName
        break
      }
    }
    if (action === null) return

    LogAllow && console.log('action to be run by cmdk: ', action)

    // prevent chrome default short keys
    if (action === 'Save' || action === 'Download') {
      e.preventDefault()
    }

    setCurrentCommand({ action })
  }, [cmdkReferenceData, activePanel, osType])
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
      case 'Code':
        toogleCodeView()
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
  const loadProject = useCallback(async (fsType: TProjectContext, projectHandle?: FileSystemHandle | null) => {
    if (fsType === 'local') {
      setFSPending(true)
      clearSession()
      try {
        // configure idb on nohost
        const handlerObj = await loadLocalProject(projectHandle as FileSystemDirectoryHandle, osType)

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
              orgContent: type !== 'unknown' ? content?.toString() : '',
              content: type !== 'unknown' ? content?.toString() : '',
              changed: false,
            } as TFileNodeData,
          } as TNode

          ffHandlerObj[uid] = handler
        })

        setFFTree(treeViewData)
        setFFHandlers(ffHandlerObj)

        dispatch(setProjectContext('local'))
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

        dispatch(setProjectContext('idb'))
      } catch (err) {
        LogAllow && console.log('failed to load default project')
      }
      setFSPending(false)
    }
  }, [clearSession, osType])
  const onImportProject = useCallback(async (fsType: TProjectContext = 'local'): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      if (fsType === 'local') {
        try {
          const projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
          await loadProject(fsType, projectHandle)
          await set('project-root-folder-handler', projectHandle)
        } catch (err) {
          reject(err)
        }
      } else if (fsType === 'idb') {
        try {
          await loadProject(fsType)
        } catch (err) {
          reject(err)
        }
      }
      resolve()
    })
  }, [loadProject])
  // open
  const onOpen = useCallback(async () => {
    setFSPending(true)

    try {
      await onImportProject()
    } catch (err) {
      LogAllow && console.log('failed to open project')
    }

    setFSPending(false)
  }, [onImportProject])
  // new
  const onNew = useCallback(async () => {
    setFSPending(true)

    // init/open default project
    try {
      await initIDBProject(DefaultProjectPath)
      await onImportProject('idb')
    } catch (err) {
      LogAllow && console.log('failed to init/load default project')
    }

    setFSPending(false)
  }, [onImportProject])
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
    localStorage.clear()
    await delMany(['project-context', 'project-root-folder-handler'])
  }, [])
  // jumpstart
  const onJumpstart = useCallback(() => {
    if (cmdkOpen) return
    setCmdkPages(['Jumpstart'])
    setCmdkOpen(true)
  }, [cmdkOpen])
  // hms
  const onUndo = useCallback(() => {
    if (pending || iframeLoading || fsPending || codeEditing) return

    LogAllow && pastLength === 1 && console.log('hms - it is the origin state')
    if (pastLength === 1) return

    setCurrentFileUid(file.uid)
    setIsHms(true)

    dispatch({ type: 'main/undo' })
    setUpdateOpt({ parse: true, from: 'hms' })
  }, [pending, iframeLoading, fsPending, codeEditing, pastLength, fileAction, file.uid])
  const onRedo = useCallback(() => {
    if (pending || iframeLoading || fsPending || codeEditing) return

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
  // -------------------------------------------------------------- resizable panels --------------------------------------------------------------
  const [showActionsPanel, setShowActionsPanel] = useState(true)
  const [panelSizes, setPanelSizes] = useState<number[]>([10, 60, 30])
  useEffect(() => {
    const sizes = localStorage.getItem('main-page-panel-sizes')
    sizes && setPanelSizes(JSON.parse(sizes))
  }, [])
  // -------------------------------------------------------------- other --------------------------------------------------------------
  // detect OS & fetch reference - html. Jumpstart.csv, Actions.csv
  useEffect(() => {
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
      const pureTag = htmlRefElement['Name'] === 'Comment' ? 'comment' : htmlRefElement['Tag'].slice(1, htmlRefElement['Tag'].length - 1)
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
    cmdkRefJumpstart.map((command: TCmdkReference) => {
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

      _cmdkReferenceData[_command['Name']] = _command
    })
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
  }, [])
  // newbie flag
  useEffect(() => {
    const isNewbie = localStorage.getItem("newbie")
    LogAllow && console.log('isNewbie: ', isNewbie === null ? true : false)
    if (!isNewbie) {
      onJumpstart()
      localStorage.setItem("newbie", 'false');

      (async () => {
        setFSPending(true)
        try {
          // init/open default project if it's newbie
          await initIDBProject(DefaultProjectPath)
          await onImportProject('idb')
          LogAllow && console.log('inited/loaded default project')
        } catch (err) {
          LogAllow && console.log('failed to init/load default project')
        }
        setFSPending(false)
      })()
    }
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
  // store/restore last edit session
  useEffect(() => {
    (async () => {
      const hasSession = localStorage.getItem('last-edit-session') !== null
      if (hasSession) {
        try {
          const sessionInfo = await getMany(['project-context', 'project-root-folder-handler'])
          const session: TSession = {
            'project-context': sessionInfo[0],
            'project-root-folder-handler': sessionInfo[1],
          }
          await loadProject(session['project-context'], session['project-root-folder-handler'])
          LogAllow && console.log('last session loaded')
        } catch (err) {
          LogAllow && console.log('failed to load last session')
        }
      }
    })()
  }, [])
  useEffect(() => {
    (async () => {
      try {
        await set('project-context', project.context)
        localStorage.setItem('last-edit-session', 'yes')
      } catch (err) {
        localStorage.removeItem('last-edit-session')
      }
    })()
  }, [project.context])

  return <>
    {/* wrap with the context */}
    <MainContext.Provider
      value={{
        // global action
        addRunningActions, removeRunningActions,
        // node actions
        activePanel, setActivePanel,
        clipboardData, setClipboardData,
        event, setEvent,
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
      }}
    >
      {/* process */}
      <Process />

      {/* spinner */}
      <Loader show={pending || iframeLoading || fsPending || codeEditing}></Loader>

      <Split
        id='MainPage'
        className={'view'}
        style={{ display: 'flex' }}

        sizes={panelSizes}
        minSize={[showActionsPanel ? 240 : 0, 240, showCodeView ? 400 : 0]}
        maxSize={[Infinity, Infinity, showCodeView ? Infinity : 0]}

        expandToMin={true}

        gutterSize={8}

        snapOffset={30}
        dragInterval={1}

        direction="horizontal"
        cursor="col-resize"

        onDragEnd={(sizes: number[]) => {
          setPanelSizes(sizes)
          localStorage.setItem('main-page-panel-sizes', JSON.stringify(sizes))
        }}

        elementStyle={(_dimension: "height" | "width", elementSize: number, _gutterSize: number, _index: number) => {
          return {
            'width': 'calc(' + elementSize + '%)',
          }
        }}
        gutterStyle={(_dimension: "height" | "width", gutterSize: number, _index: number) => {
          return {
            'width': gutterSize + 'px',
          }
        }}

        collapsed={!showCodeView ? 2 : undefined}
      >
        <ActionsPanel />
        <StageView />
        <div id='CodeViewWrapper'>
          {showCodeView && <CodeView />}
        </div>
      </Split>

      {/* cmdk modal */}
      <Command.Dialog
        open={cmdkOpen}
        onOpenChange={setCmdkOpen}
        onKeyDown={(e: React.KeyboardEvent) => {
          // Escape goes to previous page
          // Backspace goes to previous page when search is empty
          if (e.code === 'Escape' || (e.code === 'Backspace' && !cmdkSearch)) {
            if (e.code === 'Escape' && cmdkPages.length === 1) {
              setCmdkPages([])
              setCmdkOpen(false)
            }

            cmdkPages.length !== 1 && setCmdkPages((cmdkPages) => cmdkPages.slice(0, -1))
          }

          e.stopPropagation()
        }}
        filter={(value: string, search: string) => {
          return value.includes(search) !== false ? 1 : 0
        }}
        loop={true}
        className='hidden-on-mobile box-l direction-row align-center justify-stretch radius-s border shadow background-primary'
        label={cmdkPage}
      >
        {/* search input */}
        <div className='gap-m box-l border-bottom padding-m justify-start'>
          <Command.Input
            value={cmdkSearch}
            onValueChange={setCmdkSearch}
            className={cx(
              'justify-start',
              'padding-s',
              'gap-s',
              'text-l',
              'background-primary',
            )}
            placeholder={cmdkPage === 'Jumpstart' ? 'Jumpstart...' :
              cmdkPage === 'Actions' ? 'Do something...' :
                cmdkPage === 'Add' ? 'Add something...' : ''} />
        </div>

        {/* modal content */}
        <div
          className={cmdkPage === 'Actions' ? "" : "box-l direction-column align-stretch box"}
          style={cmdkPage === 'Actions' ? { width: "100%" } : {}}
        >
          {/* menu list - left panel */}
          <div className="padding-m">
            <div className="direction-row align-stretch">
              <Command.List style={{ maxHeight: "600px", overflow: "auto" }}>
                {/* <Command.Loading>Fetching commands reference data...</Command.Loading> */}

                {/* <Command.Empty>No results found for "{cmdkSearch}".</Command.Empty> */}

                {Object.keys(cmdkPage === 'Jumpstart' ? cmdkReferenceJumpstart :
                  cmdkPage === 'Actions' ? cmdkReferenceActions :
                    cmdkPage === 'Add' ? cmdkReferenceAdd : {}
                ).map((groupName: string) =>
                  <Command.Group
                    key={groupName}
                    // heading={groupName}
                    value={groupName}
                  >
                    {/* group heading label */}
                    <div className="padding-m gap-s">
                      <span className="text-s opacity-m">{groupName}</span>
                    </div>
                    {(cmdkPage === 'Jumpstart' ? cmdkReferenceJumpstart[groupName] :
                      cmdkPage === 'Actions' ? cmdkReferenceActions[groupName] :
                        cmdkPage === 'Add' ? cmdkReferenceAdd[groupName] : []
                    ).map((command: TCmdkReference) => {
                      const context: TCmdkContext = (command.Context as TCmdkContext)
                      const show: boolean = (
                        (cmdkPage === 'Jumpstart') ||
                        (cmdkPage === 'Actions' && (
                          (context.all === true) ||
                          (activePanel === 'file' && (
                            (context['file'] === true) ||
                            (false)
                          )) ||
                          ((activePanel === 'node' || activePanel === 'stage') && (
                            (/* file.type === 'html' &&  */context['html'] === true) ||
                            (false)
                          ))
                        )) ||
                        (cmdkPage === 'Add' && (
                          (activePanel === 'file' && groupName === 'Files') ||
                          ((activePanel === 'node' || activePanel === 'stage') && groupName === 'Elements')
                        ))
                      )
                      return show ?
                        <Command.Item
                          key={command.Name}
                          value={command.Name}
                          // disabled={false}
                          onSelect={() => {
                            // keep modal open when toogling theme
                            command.Name !== 'Theme' && setCmdkOpen(false)

                            setCurrentCommand({ action: command.Group === 'Add' ? `${AddNodeActionPrefix}-${command.Context}` : command.Name })
                          }}
                        >
                          <div
                            className={cx(
                              'justify-stretch padding-s',
                              // false && 'opacity-m', // disabled
                              // command['Name'] === currentCommand.action && 'background-secondary radius-xs', // hover
                            )}
                          >
                            <div className="gap-s align-center">
                              {/* detect Theme Group and render check boxes */}
                              {cmdkPage === 'Jumpstart' && command.Name === 'Theme' ?
                                <>
                                  <div className="padding-xs">
                                    <div className="radius-m icon-xs align-center background-secondary"></div>
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
                )}
              </Command.List>
            </div>
          </div>

          {/* description - right panel */}
          {cmdkPage !== 'Actions' && <div className="box align-center border-left direction-row">
            Description
          </div>}
        </div>
      </Command.Dialog>
    </MainContext.Provider>
  </>
}