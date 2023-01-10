import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

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
import {
  TTree,
  TUid,
} from '@_node/types';
import {
  Command,
  FFAction,
  FFHandlers,
  globalSelector,
  hmsInfoSelector,
  increaseActionGroupIndex,
  MainContext,
  Message,
  UpdateOptions,
} from '@_redux/main';
import { FFTree } from '@_types/main';

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

    console.log('RUNNING', runningActions.current)

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

    console.log('RUNNING', runningActions.current)

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
  // ---------------- main context ----------------

  // ---------------- cmdk ----------------
  // key event listener
  const cb_onKeyDown = useCallback((e: KeyboardEvent) => {
    if (pending) return

    if (e.code === 'KeyK' && e.ctrlKey) {
      e.preventDefault()
      setCmdkOpen(true)
    }

    else if (e.code === 'KeyO' && e.ctrlKey) {
      e.preventDefault()
      setCommand({ action: "OpenProject", changed: !command.changed })
    }

    else if (e.code === 'KeyZ' && e.ctrlKey && e.shiftKey) {
      setCommand({ action: "redo", changed: !command.changed })
    } else if (e.code === 'KeyZ' && e.ctrlKey) {
      setCommand({ action: "undo", changed: !command.changed })
    }

    else if (e.code === 'KeyS' && e.ctrlKey) {
      e.preventDefault()
      setCommand({ action: "save", changed: !command.changed })
    }

    else if (e.code === 'KeyC') {
      // skip the codeView key events
      if (e.target === null || (e.target as HTMLElement).nodeName !== 'BODY') return

      setCommand({ action: "toogleCodeView", changed: !command.changed })
    }
  }, [command.changed, pending])

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

  // do actions
  useEffect(() => {
    // cmdk actions handle
    switch (command.action) {
      case 'undo':
        undo()
        break
      case 'redo':
        redo()
        break
      case 'toogleCodeView':
        toogleCodeView()
        break
      default:
        break
    }

    // close modal
    setCmdkOpen(false)
  }, [command.changed])
  // ---------------- cmdk ----------------

  // redux state
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

  // svg-icon
  /* const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return 'svg-icon' as keyof JSX.IntrinsicElements
  }, []) */

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
          <StageView />
          {showCodeView && <CodeView />}
        </div>
      </div>
    </MainContext.Provider>
  </>
}