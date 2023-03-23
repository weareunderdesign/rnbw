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
  getMany,
  setMany,
} from 'idb-keyval';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { PanelGroup } from 'react-resizable-panels';
import {
  useLocation,
  useParams,
} from 'react-router-dom';

import {
  Loader,
  ResizeHandle,
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
  DefaultTabSize,
  LogAllow,
  RootNodeUid,
} from '@_constants/main';
import {
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
  ffSelector,
  fnSelector,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  increaseActionGroupIndex,
  MainContext,
  navigatorSelector,
  setFileAction,
  TCommand,
  TFileHandlerCollection,
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

    LogAllow && console.log(actionNames, effect)

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
      if (node) {
        const refData = htmlReferenceData.elements[node.name]
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
  }, [activePanel, ffTree, ffFocusedItem, filesReferenceData, nodeTree, fnFocusedItem, htmlReferenceData, cmdkSearch])
  // other
  const [osType, setOsType] = useState<TOsType>('Windows')
  const [theme, setTheme] = useState<TTheme>('System')
  const [panelResizing, setPanelResizing] = useState<boolean>(false)
  const [hasSession, setHasSession] = useState<boolean>(false)
  const [session, setSession] = useState<TSession | null>(null)
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
  // store last edit session
  useEffect(() => {
    (async () => {
      const _hasSession = localStorage.getItem('last-edit-session') !== null
      setHasSession(_hasSession)
      let _session: TSession | null = null
      if (_hasSession) {
        const sessionInfo = await getMany(['project-context', 'project-root-folder-handler'])
        _session = {
          'project-context': sessionInfo[0],
          'project-root-folder-handler': sessionInfo[1],
        }
        setSession(_session)
      }
      LogAllow && console.log('last-edit-session', _session)
    })()
  }, [])
  useEffect(() => {
    (async () => {
      if (ffTree[RootNodeUid]) {
        try {
          await setMany([['project-context', project.context], ['project-root-folder-handler', ffHandlers[RootNodeUid]]])
          localStorage.setItem('last-edit-session', 'yes')
        } catch (err) {
          localStorage.removeItem('last-edit-session')
        }
      }
    })()
  }, [ffTree[RootNodeUid]])
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
    e.preventDefault()

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
      case 'Clear':
        onClear()
      case 'Save':
        onSaveAll()
        break
      case 'Jumpstart':
        onJumpstart()
        break
      case 'Theme':
        onToggleTheme()
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
      default:
        return
    }
  }, [currentCommand])
  // -------------------------------------------------------------- handlers --------------------------------------------------------------
  // save all of the changed files
  const onSaveAll = useCallback(async () => {
    /* const _openedFiles: { [uid: TNodeUid]: TFile } = {}
    const uids = Object.keys(openedFiles)
    const changedFiles: TFile[] = []
    uids.map(uid => {
      const _file = openedFiles[uid]
      _openedFiles[uid] = { ..._file }
      _file.changed && changedFiles.push(_file)
    })

    setPending(true)

    let saveDone = false
    changedFiles.length && await Promise.all(changedFiles.map(async (_file) => {
      // get the current file handler
      const handler = ffHandlers[_file.uid]
      if (handler === undefined) return

      // verify permission
      if (await verifyFileHandlerPermission(handler) === false) {
        addMessage({
          type: 'error',
          content: 'save failed cause of invalid handler',
        })
        return
      }

      // update file content
      try {
        const writableStream = await (handler as FileSystemFileHandle).createWritable()
        await writableStream.write(_file.content)
        await writableStream.close()

        addMessage({
          type: 'success',
          content: 'Saved successfully',
        })

        saveDone = true
        _openedFiles[_file.uid] = { ..._file, orgContent: _file.content, content: _file.content, changed: false }
      } catch (err) {
        addMessage({
          type: 'error',
          content: 'error occurred while saving',
        })
      }
    }))

    saveDone && setOpenedFiles(_openedFiles)
    setPending(false) */
  }, [ffHandlers])
  // clean rnbw'data
  const onClear = useCallback(async () => {
    /* const uids = Object.keys(openedFiles)
    const changedFiles: TFile[] = []
    uids.map(uid => {
      const _file = openedFiles[uid]
      _file.changed && changedFiles.push(_file)
    })

    if (changedFiles.length) {
      const message = `Do you want to save changes you made to ${changedFiles.length} files?
Your changes will be lost if you don't save them.`
      if (window.confirm(message)) {
        await onSaveAll()
      }
    }

    // remove localstorage and session
    localStorage.clear()
    await delMany(['project-context', 'project-root-folder-handler', 'file-tree-view-state', 'opened-file-uid', 'node-tree-view-state', 'opened-file-content'])
    setFFTree({})
    setNodeTree({})
    setOpenedFiles({})
    dispatch(clearMainState())

    // start from newbie
    onJumpstart()
    localStorage.setItem("newbie", 'false') */
  }, [onSaveAll])
  // cmdk jumpstart
  const onJumpstart = useCallback(() => {
    if (cmdkOpen) return
    setCmdkPages(['Jumpstart'])
    setCmdkOpen(true)
  }, [cmdkOpen])
  // hms methods
  const onUndo = useCallback(() => {
    if (pending || iframeLoading || fsPending || codeEditing) return

    LogAllow && pastLength === 1 && console.log('hms - it is the origin state')
    if (pastLength === 1) return

    // setFFAction(fileAction)
    // setIsHms(true)

    dispatch({ type: 'main/undo' })
    setUpdateOpt({ parse: true, from: 'hms' })
  }, [pending, iframeLoading, fsPending, codeEditing, pastLength])
  const onRedo = useCallback(() => {
    if (pending || iframeLoading || fsPending || codeEditing) return

    LogAllow && futureLength === 0 && console.log('hms - it is the latest state')
    if (futureLength === 0) return

    // setIsHms(false)

    dispatch({ type: 'main/redo' })
    setUpdateOpt({ parse: true, from: 'hms' })
  }, [pending, iframeLoading, fsPending, codeEditing, futureLength])
  // reset fileAction in the new history
  useEffect(() => {
    futureLength === 0 && fileAction.type !== null && dispatch(setFileAction({ type: null }))
  }, [actionGroupIndex])
  // toogle code view visible
  const [showCodeView, setShowCodeView] = useState(false)
  const toogleCodeView = useCallback(() => {
    setShowCodeView(!showCodeView)
  }, [showCodeView])
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
    const _cmdkReferenceData: TCmdkReferenceData = {} // cmdk map
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
      // open Jumpstart for newbie
      onJumpstart()
      localStorage.setItem("newbie", 'false')
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
        fsPending, setFSPending,
        ffTree, setFFTree, setFFNode,
        ffHandlers, setFFHandlers,
        ffHoveredItem, setFFHoveredItem,
        isHms, setIsHms,
        ffAction, setFFAction,
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
        panelResizing, setPanelResizing,
        hasSession, session,
        // toasts
        addMessage, removeMessage
      }}
    >
      {/* process */}
      <Process />

      {/* spinner */}
      <Loader show={pending || iframeLoading || fsPending || codeEditing}></Loader>

      {/* panels */}
      <PanelGroup
        // autoSaveId="panel-layout"
        className='view'
        direction="horizontal"
      >
        <ActionsPanel />

        <ResizeHandle direction='horizontal'></ResizeHandle>

        <StageView />

        {showCodeView && <>
          <ResizeHandle direction='horizontal'></ResizeHandle>

          <CodeView />
        </>}
      </PanelGroup>

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
                            setCmdkOpen(false)
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