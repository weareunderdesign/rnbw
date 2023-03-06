import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import cx from 'classnames';
import { useSelector } from 'react-redux';

import {
  LogAllow,
  NodeInAppAttribName,
} from '@_constants/main';
import {
  MainContext,
  navigatorSelector,
} from '@_redux/main';
import { getCommandKey } from '@_services/global';
import { TCmdkKeyMap } from '@_types/main';

import { IFrameProps } from './types';

export const IFrame = (props: IFrameProps) => {
  // main context
  const {
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, setFFTree, updateFF,

    // ndoe tree view
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,

    // update opt
    updateOpt, setUpdateOpt,

    // ff hms
    isHms, setIsHms, ffAction, setFFAction,

    // cmdk
    currentCommand, setCurrentCommand, cmdkOpen, setCmdkOpen, cmdkPages, setCmdkPages, cmdkPage,

    // global
    pending, setPending, messages, addMessage, removeMessage,

    // reference
    htmlReferenceData, cmdkReferenceData, cmdkReferenceJumpstart, cmdkReferenceActions, cmdkReferenceAdd,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    osType,

    // code view
    tabSize, setTabSize,

    // panel-resize
    panelResizing,
  } = useContext(MainContext)

  // redux state
  const { workspace, project, file } = useSelector(navigatorSelector)

  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)

  const onMouseEnter = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    LogAllow && console.log('mouse enter', className)
  }, [])
  const onMouseLeave = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    LogAllow && console.log('mouse leave', className)
  }, [])
  const onMouseDown = useCallback((ele: HTMLElement) => {
    const uid = ele.getAttribute(NodeInAppAttribName)
    LogAllow && console.log('mouse down', uid)
  }, [])
  const onMouseUp = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    LogAllow && console.log('mouse up', className)
  }, [])
  const onDblClick = useCallback((e: MouseEvent) => {
    interface _EventTarget extends EventTarget { className?: string }
    const target: _EventTarget | null = e.target
    const className = target?.className

    LogAllow && console.log('dbl click', className)
  }, [])

  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let loadListener: () => void
    contentRef?.addEventListener('load', loadListener = () => {
      LogAllow && console.log('iframe loaded..')

      const bodyNode = contentRef.contentWindow?.document.body
      const elements = bodyNode?.querySelectorAll('*')
      elements?.forEach((ele) => {
        (ele as HTMLElement).addEventListener('mousedown', (e: MouseEvent) => {
          e.stopPropagation()
          onMouseDown(ele as HTMLElement)
        })
      })

      const htmlNode = contentRef.contentWindow?.document.documentElement
      const fullContent = htmlNode?.outerHTML
      htmlNode?.addEventListener('keydown', (e: KeyboardEvent) => {
        // cmdk obj for the current command
        const cmdk: TCmdkKeyMap = {
          cmd: getCommandKey(e, osType),
          shift: e.shiftKey,
          alt: e.altKey,
          key: e.code,
          click: false,
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
        setCurrentCommand({ action })
      })

      setLoading(false)
    })

    return () => {
      contentRef?.removeEventListener('load', loadListener)
    }
  }, [contentRef, cmdkReferenceData])

  useEffect(() => {
    LogAllow && console.log('iframe load started..')
    setLoading(true)
  }, [file.inAppContent])

  return <>
    {
      loading &&
      <div
        className={cx(
          'text-s',
          'align-center',
        )}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      >
        loading..
      </div>
    }
    <iframe
      ref={setContentRef}
      srcDoc={file.inAppContent}
      style={{ position: "absolute", width: "100%", height: "100%" }}
    />
  </>
}