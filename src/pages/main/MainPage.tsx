import './styles.css';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import cx from 'classnames';
import {
  Command,
  useCommandState,
} from 'cmdk';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { Toast } from '@_components/common';
import {
  ActionsPanel,
  CodeView,
  Process,
  StageView,
} from '@_components/main';
import {
  THtmlReference,
  THtmlReferenceData,
} from '@_node/html';
import {
  TTree,
  TUid,
} from '@_node/types';
import {
  FFAction,
  FFHandlers,
  getActionGroupIndexSelector,
  globalSelector,
  hmsInfoSelector,
  increaseActionGroupIndex,
  MainContext,
  Message,
  setFFAction as _setFFAction,
  TClipboardData,
  TCommand,
  TPanel,
  UpdateOptions,
} from '@_redux/main';
// @ts-ignore
import cmdkRefActions from '@_ref/cmdk.ref/Actions.csv';
// @ts-ignore
import cmdkRefJumpstart from '@_ref/cmdk.ref/Jumpstart.csv';
// @ts-ignore
import htmlRefElements from '@_ref/rfrncs.design/HTML Elements.csv';
import {
  CmdkData,
  FFTree,
  TCmdk,
  TCmdkContext,
  TCmdkContextScope,
  TCmdkReference,
  TCmdkReferenceData,
} from '@_types/main';

import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  const dispatch = useDispatch()

  // -------------------------------------------------------------- main context --------------------------------------------------------------
  // groupping action
  const runningActions = useRef<{ [actionName: string]: boolean }>({})
  const noRunningAction = () => {
    return Object.keys(runningActions.current).length === 0 ? true : false
  }
  const addRunningActions = (actionNames: string[]) => {
    let found: boolean = false
    for (const actionName of actionNames) {
      if (runningActions.current[actionName] === undefined) {
        runningActions.current[actionName] = true
        found = true
      }
    }
    if (!found) return

    setPending(true)
  }
  const removeRunningActions = (actionNames: string[], effect: boolean = true) => {
    let found: boolean = false
    for (const actionName of actionNames) {
      if (runningActions.current[actionName] !== undefined) {
        delete runningActions.current[actionName]
        found = true
      }
    }
    if (!found) return

    if (noRunningAction()) {
      setPending(false)
      effect && dispatch(increaseActionGroupIndex())
    }
  }

  // file tree view
  const [ffHoveredItem, setFFHoveredItem] = useState<TUid>('')
  const [ffHandlers, setFFHandlers] = useState<FFHandlers>({})
  const [ffTree, setFFTree] = useState<FFTree>({})
  const updateFF = useCallback((deletedUids: { [uid: TUid]: boolean }, nodes: FFTree, handlers: { [uid: TUid]: FileSystemHandle }) => {
    setFFTree({ ...ffTree, ...nodes })

    const newFFHandlers: FFHandlers = {}
    for (const uid in ffHandlers) {
      if (deletedUids[uid] === undefined) {
        newFFHandlers[uid] = ffHandlers[uid]
      }
    }
    setFFHandlers({ ...newFFHandlers, ...handlers })
  }, [ffTree, ffHandlers])

  // node tree view
  const [fnHoveredItem, setFNHoveredItem] = useState<TUid>('')
  const [nodeTree, setNodeTree] = useState<TTree>({})
  const [validNodeTree, setValidNodeTree] = useState<TTree>({})

  // update opt
  const [updateOpt, setUpdateOpt] = useState<UpdateOptions>({
    parse: null,
    from: null,
  })

  // ff hms
  const [isHms, setIsHms] = useState<boolean | null>(null)
  const [ffAction, setFFAction] = useState<FFAction>({ name: null })

  // cmdk
  const [currentCommand, setCurrentCommand] = useState<TCommand>({ action: '', changed: false })
  const [cmdkOpen, setCmdkOpen] = useState<boolean>(false)
  const [cmdkPages, setCmdkPages] = useState<string[]>([])
  const cmdkPage = useMemo(() => {
    return cmdkPages.length == 0 ? '' : cmdkPages[cmdkPages.length - 1]
  }, [cmdkPages])

  // global
  const [pending, setPending] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>([])
  const addMessage = (message: Message) => {
    setMessages([...messages, message])
  }
  const removeMessage = (index: number) => {
    const newMessages = JSON.parse(JSON.stringify(messages))
    newMessages.splice(index)
    setMessages(JSON.parse(JSON.stringify(newMessages)))
  }

  // references
  const [htmlReferenceData, setHtmlReferenceData] = useState<THtmlReferenceData>({})
  const [cmdkReferenceData, setCmdkReferenceData] = useState<TCmdkReferenceData>({})
  const [cmdkReferenceJumpstart, setCmdkReferenceJumpstart] = useState<CmdkData>({})
  const [cmdkReferenceActions, setCmdkReferenceActions] = useState<CmdkData>({})

  // active panel/clipboard
  const [activePanel, setActivePanel] = useState<TPanel>('other')
  const [clipboardData, setClipboardData] = useState<TClipboardData>({ panel: 'other', type: null, uids: [] })
  // -------------------------------------------------------------- main context --------------------------------------------------------------

  // fetch reference - html. Jumpstart.csv, Actions.csv
  useEffect(() => {
    addRunningActions(['reference-html-elements', 'reference-cmdk-jumpstart', 'reference-cmdk-actions'])

    // reference-html-elements
    const _htmlReferenceData: THtmlReferenceData = {}
    htmlRefElements.map((htmlRefElement: THtmlReference) => {
      const pureTag = htmlRefElement['Name'] === 'Comment' ? 'comment' : htmlRefElement['Tag'].slice(1, htmlRefElement['Tag'].length - 1)
      _htmlReferenceData[pureTag] = htmlRefElement
    })
    setHtmlReferenceData(_htmlReferenceData)
    console.log('HTML REFERENCE DATA', _htmlReferenceData)

    // add default cmdk actions
    const _cmdkReferenceData: TCmdkReferenceData = {} // cmdk map
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
        key: 'KeyA',
        click: false,
      },
      "Group": 'default',
      "Context": 'all',
    }

    // reference-cmdk-jumpstart
    const _cmdkRefJumpstartData: CmdkData = {}
    cmdkRefJumpstart.map((command: TCmdkReference) => {
      const keys: string[] = (command["Keyboard Shortcut"] as string)?.replace(/ /g, "").split('+')
      const keyObj: TCmdk = {
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

    // reference-cmdk-actions
    const _cmdkRefActionsData: CmdkData = {}
    cmdkRefActions.map((command: TCmdkReference) => {
      const contexts: TCmdkContextScope[] = (command['Context'] as string).replace(/ /g, "").split(',').map((scope: string) => scope as TCmdkContextScope)
      const contextObj: TCmdkContext = {
        "all": false,
        "local-file": false,
        "html-node": false,
      }
      contexts.map((context: TCmdkContextScope) => {
        contextObj[context] = true
      })

      const keys: string[] = (command["Keyboard Shortcut"] as string)?.replace(/ /g, "").split('+')
      const keyObj: TCmdk = {
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

    // cmdk map
    setCmdkReferenceData(_cmdkReferenceData)

    console.log('CMDK REFERENCE DATA', _cmdkReferenceData, _cmdkRefJumpstartData, _cmdkRefActionsData)

    removeRunningActions(['reference-html-elements', 'reference-cmdk-jumpstart', 'reference-cmdk-actions'], false)
  }, [])

  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  // cmdk modal handle variables
  const [cmdkSearch, setCmdkSearch] = useState<string>('')

  // cmdk subItem component
  const CmdkSubItem = (props: any) => {
    const search = useCommandState((state) => state.search)
    if (!search) return null
    return <Command.Item {...props} />
  }

  // key event listener
  const cb_onKeyDown = useCallback((e: KeyboardEvent) => {
    if (pending) return

    // cmdk obj for the current command
    const cmdk: TCmdk = {
      cmd: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      key: e.code,
      click: false,
    }

    // skip monaco-editor shortkeys and general coding
    const targetClassName = (e.target as HTMLElement).className
    if (targetClassName.includes('monaco-mouse-cursor-text') !== false) {
      // copy
      if (cmdk.cmd && !cmdk.shift && !cmdk.alt && cmdk.key === 'KeyC') {
        return
      }
      // paste
      if (cmdk.cmd && !cmdk.shift && !cmdk.alt && cmdk.key === 'KeyV') {
        return
      }
      // cut
      if (cmdk.cmd && !cmdk.shift && !cmdk.alt && cmdk.key === 'KeyX') {
        return
      }
      // general coding
      if (!cmdk.cmd && !cmdk.shift && !cmdk.alt) {
        return
      }
    }

    // skip if its from cmdk-input
    const cmdkInputAttr = (e.target as HTMLElement).getAttribute('cmdk-input')
    if (cmdkInputAttr !== null) {
      return
    }

    // detect action
    let action: string | null = null
    for (const actionName in cmdkReferenceData) {
      const _cmdk = cmdkReferenceData[actionName]['Keyboard Shortcut'] as TCmdk

      const key = _cmdk.key.length === 0 ? '' : (_cmdk.key.length === 1 ? 'Key' : '') + _cmdk.key[0].toUpperCase() + _cmdk.key.slice(1)
      if (cmdk.cmd === _cmdk.cmd && cmdk.shift === _cmdk.shift && cmdk.alt === _cmdk.alt && cmdk.key === key) {
        action = actionName
        break
      }
    }
    if (action === null) return

    console.log('RUN ACTION', action)
    e.preventDefault()

    setCurrentCommand({ action, changed: !currentCommand.changed })
  }, [currentCommand.changed, pending, cmdkReferenceData])

  // bind onKeyDownCallback (cb_onKeyDown)
  useEffect(() => {
    document.addEventListener('keydown', cb_onKeyDown)
    return () => document.removeEventListener('keydown', cb_onKeyDown)
  }, [cb_onKeyDown])

  // command detect & do actions
  useEffect(() => {
    // cmdk actions handle
    switch (currentCommand.action) {
      case 'Jumpstart':
        onJumpstart()
        break
      case 'Dark Mode':
        onDarkMode()
        break
      case 'Light Mode':
        onLightMode()
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
  }, [currentCommand.changed])
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { project, currentFile, action } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)

  // -------------------------------------------------------------- handlers --------------------------------------------------------------
  // cmdk jumpstart
  const onJumpstart = useCallback(() => {
    if (cmdkOpen) return
    setCmdkPages(['Jumpstart'])
    setCmdkOpen(true)
  }, [cmdkOpen])

  // theme
  const onDarkMode = useCallback(() => {
    setTheme('Dark Mode')
  }, [])
  const onLightMode = useCallback(() => {
    setTheme('Light Mode')
  }, [])

  // hms methods
  const onUndo = useCallback(() => {
    if (pastLength === 0) return

    setFFAction(action)
    setIsHms(true)

    setUpdateOpt({ parse: true, from: 'hms' })
    setTimeout(() => dispatch({ type: 'main/undo' }), 0)
  }, [action, pastLength])
  const onRedo = useCallback(() => {
    if (futureLength === 0) return

    setIsHms(false)

    setUpdateOpt({ parse: true, from: 'hms' })
    setTimeout(() => dispatch({ type: 'main/redo' }), 0)
  }, [futureLength])

  // reset ffAction in the new history
  useEffect(() => {
    futureLength === 0 && action.name !== null && dispatch(_setFFAction({ name: null }))
  }, [actionGroupIndex])

  // toogle code view
  const [showCodeView, setShowCodeView] = useState(false)
  const toogleCodeView = async () => {
    setShowCodeView(!showCodeView)
  }
  // -------------------------------------------------------------- handlers --------------------------------------------------------------

  // -------------------------------------------------------------- other --------------------------------------------------------------
  // theme
  const [theme, setTheme] = useState<'Light Mode' | 'Dark Mode' | 'System'>('Light Mode')

  // active panel/element
  const activeElement = document.activeElement
  useEffect(() => {
    if (activeElement === null) return

    const id = activeElement.id
    if (id.startsWith('FileTreeView') === true) {
      setActivePanel('file')
    } else if (id.startsWith('NodeTreeView') === true) {
      setActivePanel('node')
    } else {
      // do nothing
    }
  }, [activeElement])
  useEffect(() => {
    console.log('ACTIVE PANEL', activePanel)
  }, [activePanel])

  // Web Component - svg-icon
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return 'svg-icon' as keyof JSX.IntrinsicElements
  }, [])
  // -------------------------------------------------------------- other --------------------------------------------------------------

  return <>
    {/* wrap with the context */}
    <MainContext.Provider
      value={{
        // groupping action
        addRunningActions,
        removeRunningActions,

        // file tree view
        ffHoveredItem,
        setFFHoveredItem,

        ffHandlers,
        ffTree,
        setFFTree,
        updateFF,

        // node tree view
        fnHoveredItem,
        setFNHoveredItem,

        nodeTree,
        setNodeTree,

        validNodeTree,
        setValidNodeTree,

        // update opt
        updateOpt,
        setUpdateOpt,

        // ff hms
        isHms,
        setIsHms,
        ffAction,
        setFFAction,

        // cmdk
        currentCommand,
        setCurrentCommand,

        // global
        pending,
        setPending,

        messages,
        addMessage,
        removeMessage,

        // reference
        htmlReferenceData,

        cmdkReferenceData,
        cmdkReferenceJumpstart,
        cmdkReferenceActions,

        // cmdk
        cmdkOpen,
        setCmdkOpen,

        cmdkPages,
        setCmdkPages,
        cmdkPage,

        // active panel/clipboard
        activePanel,
        setActivePanel,

        clipboardData,
        setClipboardData,
      }}
    >
      {/* process */}
      <Process />

      {/* view */}
      <div className="view">
        <div className="direction-column background-primary">
          {/* spinner */}
          {pending &&
            <div
              className='justify-center align-center background-secondary opacity-m'
              style={{ zIndex: "9999", position: "fixed", top: "0", right: "0", bottom: "0", left: "0" }}
            >
              <span className='text-s'>Pending...</span>
            </div>}

          {/* panels */}
          <ActionsPanel />
          {<StageView />}
          {showCodeView && <CodeView />}
        </div>
      </div>


      {/* cmdk modal */}
      <Command.Dialog
        open={cmdkOpen}
        onOpenChange={setCmdkOpen}
        onKeyDown={(e: React.KeyboardEvent) => {
          // Escape goes to previous page
          // Backspace goes to previous page when search is empty
          if (e.code === 'Escape' || (e.code === 'Backspace' && !cmdkSearch)) {
            e.code === 'Escape' && cmdkPages.length <= 1 && setCmdkOpen(false)

            e.preventDefault()

            setCmdkPages((cmdkPages) => cmdkPages.slice(0, -1))
          }
        }}
        filter={(value: string, search: string) => {
          if (value.includes(search)) return 1
          return 0
        }}
        loop={true}
        className='hidden-on-mobile box-m direction-row align-center justify-stretch radius-s border shadow background-primary'
        label={cmdkPage}
      >
        {/* search input */}
        <div className='gap-m box-l border-bottom padding-m justify-start'>
          <Command.Input
            value={cmdkSearch}
            onValueChange={setCmdkSearch}
            className={'justify-start gap-s padding-s text-l'}
            placeholder={cmdkPage === 'Jumpstart' ? 'Jumpstart...' :
              cmdkPage === 'Actions' ? 'Do something...' :
                cmdkPage === 'Add' ? 'Add...' : ''} />
        </div>

        {/* modal content */}
        <div
          className={cmdkPage === 'Actions' ? "" : "box-l direction-column align-stretch box"}
          style={cmdkPage === 'Actions' ? { width: "100%" } : {}}
        >
          {/* menu list - left panel */}
          <div className="padding-m">
            <div className="direction-row align-stretch">
              <Command.List style={{ overflow: "auto" }}>
                {/* <Command.Loading>Fetching commands reference data...</Command.Loading> */}

                {/* <Command.Empty>No results found for "{cmdkSearch}".</Command.Empty> */}

                {Object.keys(cmdkPage === 'Actions' ? cmdkReferenceActions :
                  cmdkPage === 'Jumpstart' ? cmdkReferenceJumpstart : {}
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
                    {(cmdkPage === 'Actions' ? cmdkReferenceActions[groupName] :
                      cmdkPage === 'Jumpstart' ? cmdkReferenceJumpstart[groupName] : []
                    ).map((command: TCmdkReference) => {
                      const context: TCmdkContext = (command.Context as TCmdkContext)
                      const show: boolean = (
                        (cmdkPage === 'Jumpstart') ||
                        (cmdkPage === 'Actions' && (
                          (context.all === true) ||
                          (activePanel === 'file' && (
                            (project.location === 'localhost' && context['local-file'] === true) ||
                            (false)
                          )) ||
                          (activePanel === 'node' && (
                            (currentFile.type === 'html' && context['html-node'] === true) ||
                            (false)
                          ))
                        ))
                      )
                      return show ?
                        <Command.Item
                          key={command.Name}
                          value={command.Name}
                          // disabled={false}
                          onSelect={() => {
                            setCmdkOpen(false)
                            setCurrentCommand({ action: command.Name, changed: !currentCommand.changed })
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
                              {cmdkPage === 'Jumpstart' && groupName === 'Theme' ? <div className='padding-xs'>
                                <div data-theme={theme === command.Name ? (theme === 'Dark Mode' ? 'light' : 'dark') : (theme === 'Dark Mode' ? 'dark' : 'light')} className='radius-m icon-xs align-center background-secondary'></div>
                              </div> : <div className="padding-xs">
                                {typeof command.Icon === 'string' && command['Icon'] !== '' && <SVGIcon style={{ display: "flex" }}>actions/{command['Icon']}</SVGIcon>}
                              </div>}

                              <span className="text-m">{command['Name']}</span>
                            </div>
                            <div className="gap-s">
                              {(command['Keyboard Shortcut'] as TCmdk).cmd && <span className="text-m">⌘</span>}
                              {(command['Keyboard Shortcut'] as TCmdk).shift && <span className="text-m">⇧</span>}
                              {(command['Keyboard Shortcut'] as TCmdk).alt && <span className="text-m">Alt</span>}
                              {command['Keyboard Shortcut'] !== undefined && (command['Keyboard Shortcut'] as TCmdk).key !== '' && <span className="text-m">
                                {(command['Keyboard Shortcut'] as TCmdk).key[0].toUpperCase() + (command['Keyboard Shortcut'] as TCmdk).key.slice(1)}
                              </span>}
                              {(command['Keyboard Shortcut'] as TCmdk).click && <span className="text-m">Click</span>}
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

      {/* toast */}
      <Toast messages={messages} />
    </MainContext.Provider>
  </>
}