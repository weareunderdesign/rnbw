import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import axios from 'axios';
import { ParseResult } from 'papaparse';
import { readString } from 'react-papaparse';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  CommandK,
  Toast,
} from '@_components/common';
import { CmdKItemGeneralProps } from '@_components/common/cmdk';
import {
  ActionsPanel,
  CodeView,
  Process,
  StageView,
} from '@_components/main';
import { CmdkReference } from '@_config/main';
import {
  THtmlReference,
  THtmlReferenceData,
} from '@_node/html';
import {
  TTree,
  TUid,
} from '@_node/types';
import {
  Command,
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
  UpdateOptions,
} from '@_redux/main';
import {
  FFTree,
  TCmdk,
  TCmdkReference,
  TCmdkReferenceData,
} from '@_types/main';

import { MainPageProps } from './types';

export default function MainPage(props: MainPageProps) {
  const dispatch = useDispatch()

  // ---------------- main context ----------------
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
  const [command, setCommand] = useState<Command>({ action: '', changed: false })

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

  // active panel/clipboard
  const [activePanel, setActivePanel] = useState<'file' | 'node' | 'stage' | 'code' | 'other'>('other')
  const [clipboardData, setClipboardData] = useState<TClipboardData>({ panel: 'other', type: null, uids: [] })
  // ---------------- main context ----------------

  // reference
  useEffect(() => {
    addRunningActions(['html-reference', 'cmdk-reference'])

    // html reference data
    axios.get(
      'https://api.github.com/repos/rnbwdev/rfrncs.design/contents/HTML.csv'
    )
      .then((res) => {
        // decode from base64-encoding
        const content = atob(res.data.content)
        const _htmlReferenceData: THtmlReferenceData = {}
        readString(content, {
          worker: true,
          complete: (results: ParseResult<string[]>) => {
            const { data, errors, meta } = results
            for (let index = 1; index < data.length; ++index) {
              const _htmlRef = data[index]
              const htmlRef: THtmlReference = {
                tag: _htmlRef[0],
                name: _htmlRef[1],
                type: _htmlRef[2],
                contain: _htmlRef[3],
                description: _htmlRef[4],
                icon: _htmlRef[5],
                content: _htmlRef[6],
                placeholder: _htmlRef[7],
                coverImage: _htmlRef[8],
              }

              const pureTag = htmlRef.name === 'Comment' ? 'comment' : htmlRef.tag.slice(1, htmlRef.tag.length - 1)
              _htmlReferenceData[pureTag] = htmlRef
            }
            console.log('HTML REFERENCE DATA', _htmlReferenceData)
            setHtmlReferenceData(_htmlReferenceData)

            removeRunningActions(['html-reference'], false)
          }
        })
      })
      .catch((err) => {
        console.log(err)
        addMessage({
          type: 'error',
          message: 'failed to load html reference',
        })
        removeRunningActions(['html-reference'], false)
      })

    // cmdk reference data
    const cmdkReference = CmdkReference
    const _cmdkReferenceData: TCmdkReferenceData = {}
    cmdkReference.map((_cmdkRef) => {
      const keys: string[] = _cmdkRef[3].replace(/ /g, "").split('+')
      const keyObj: TCmdk = {
        cmd: false,
        shift: false,
        alt: false,
        key: '',
        click: false,
      }
      keys.map((key) => {
        if (key === 'cmd' || key === 'shift' || key === 'alt' || key === 'click') {
          keyObj[key] = true
        } else {
          keyObj.key = key
        }
      })

      const data: TCmdkReference = {
        name: _cmdkRef[0],
        icon: _cmdkRef[1],
        description: _cmdkRef[2],
        keyboardShortcut: keyObj,
        type: _cmdkRef[4],
      }
      _cmdkReferenceData[data.name] = data
    })
    console.log('CMDK REFERENCE DATA', _cmdkReferenceData)
    setCmdkReferenceData(_cmdkReferenceData)

    removeRunningActions(['cmdk-reference'], false)
  }, [])

  // ---------------- cmdk ----------------
  // key event listener
  const cb_onKeyDown = useCallback((e: KeyboardEvent) => {
    if (pending) return

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

    let action: string | null = null
    for (const actionName in cmdkReferenceData) {
      const _cmdk = cmdkReferenceData[actionName].keyboardShortcut

      const key = _cmdk.key.length === 0 ? '' : (_cmdk.key.length === 1 ? 'Key' : '') + _cmdk.key[0].toUpperCase() + _cmdk.key.slice(1)
      if (cmdk.cmd === _cmdk.cmd && cmdk.shift === _cmdk.shift && cmdk.alt === _cmdk.alt && cmdk.key === key) {
        action = actionName
        break
      }
    }

    if (action === null) return

    e.preventDefault()
    console.log('ACTION', action)

    // cmdk modal
    if (action === 'cmdk') {
      setCmdkOpen(true)
      return
    }

    setCommand({ action, changed: !command.changed })

    // node actions
    if (action === 'Add') {

    } else if (action === 'Cut') {

    } else if (action === 'Copy') {

    } else if (action === 'Paste') {

    } else if (action === 'Delete') {

    } else if (action === 'Duplicate') {

    } else if (action === 'Group') {

    } else if (action === 'UnGroup') {

    } else if (action === 'Text') {

    } else if (action === 'Select') {
      // check mouse-clicking
    }

    // open project / save
    else if (action === 'Open') {
    }
    else if (action === 'Save') {
    }

    // hms
    else if (action === 'Undo') {

    } else if (action === 'Redo') {

    }

    // panels
    else if (action === 'Design') {

    } else if (action === 'Code') {

    } else if (action === 'Play') {

    } else if (action === 'Style') {

    }
  }, [command.changed, pending, cmdkReferenceData])

  // cmdk modal
  const [cmdkOpen, setCmdkOpen] = useState(false)
  const makeCmkItems = useCallback(() => {
    const items: CmdKItemGeneralProps[] = []
    items.push({
      heading: 'Start',
      items: [
        { title: 'Open', shortcut: '⌘ 🄾', onSelect: () => { setCommand({ action: "OpenProject", changed: !command.changed }) } },
        { title: 'New File', shortcut: '⌘ 🄽', onSelect: () => { } },
      ]
    }, {
      heading: 'Action',
      items: [
        { title: 'Undo', shortcut: 'Ctrl Z', onSelect: () => { setCommand({ action: "undo", changed: !command.changed }) } },
        { title: 'Redo', shortcut: 'Ctrl Y', onSelect: () => { setCommand({ action: "redo", changed: !command.changed }) } }
      ]
    })
    return items
  }, [command.changed])
  // ---------------- cmdk ----------------

  // redux state
  const actionGroupIndex = useSelector(getActionGroupIndexSelector)
  const { project, currentFile, action } = useSelector(globalSelector)
  const { futureLength, pastLength } = useSelector(hmsInfoSelector)

  // ---------------- handlers ----------------
  // hms methods
  const undo = useCallback(() => {
    if (pastLength === 0) return

    setFFAction(action)
    setIsHms(true)

    setUpdateOpt({ parse: true, from: 'hms' })
    setTimeout(() => dispatch({ type: 'main/undo' }), 0)
  }, [action, pastLength])
  const redo = useCallback(() => {
    if (futureLength === 0) return

    setIsHms(false)

    setUpdateOpt({ parse: true, from: 'hms' })
    setTimeout(() => dispatch({ type: 'main/redo' }), 0)
  }, [futureLength])

  // toogle code view
  const [showCodeView, setShowCodeView] = useState(true)
  const toogleCodeView = async () => {
    setShowCodeView(!showCodeView)
  }
  // ---------------- handlers ----------------

  // reset ffAction in the new history
  useEffect(() => {
    futureLength === 0 && action.name !== null && dispatch(_setFFAction({ name: null }))
  }, [actionGroupIndex])

  // detect active panel
  const activeElement = document.activeElement
  useEffect(() => {
    if (activeElement === null) return

    const id = activeElement.id
    if (id.startsWith('FileTreeView') === true) {
      setActivePanel('file')
    } else if (id.startsWith('NodeTreeView') === true) {
      setActivePanel('node')
    } else {
      setActivePanel('other')
    }

    console.log('ACTIVE ELEMENT', activeElement)
  }, [activeElement])
  useEffect(() => {
    console.log('ACTIVE PANEL', activePanel)
  }, [activePanel])

  // svg-icon
  /* const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return 'svg-icon' as keyof JSX.IntrinsicElements
  }, []) */

  // command detect & do actions
  useEffect(() => {
    // cmdk actions handle
    switch (command.action) {
      case 'Undo':
        undo()
        break
      case 'Redo':
        redo()
        break
      case 'Code':
        toogleCodeView()
        break
      default:
        break
    }

    // close modal
    setCmdkOpen(false)
  }, [command.changed])

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
        command,
        setCommand,

        // global
        pending,
        setPending,

        messages,
        addMessage,
        removeMessage,

        // reference
        htmlReferenceData,
        cmdkReferenceData,

        // active panel/clipboard
        activePanel,
        setActivePanel,

        clipboardData,
        setClipboardData,
      }}
    >
      {/* process */}
      <Process />

      {/* toast */}
      <Toast messages={messages} />

      {/* cmdk */}
      <CommandK
        open={cmdkOpen}
        setOpen={setCmdkOpen}
        items={makeCmkItems()}
        onKeyDownCallback={cb_onKeyDown}
      />

      {/* view */}
      <div className="view">
        <div className="direction-column background-primary border shadow">
          {/* top bar */}
          <div className="direction-column padding-s box-l justify-stretch border-bottom">
            <div className="gap-s box justify-start">
              <span className="text-s opacity-m">Actions Panel / Stage View / Code View</span>
            </div>
            <div className="gap-m justify-end box">
              {/* action bar */}
              {/* <SVGIcon size={80}></SVGIcon> */}
            </div>
          </div>

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
    </MainContext.Provider>
  </>
}