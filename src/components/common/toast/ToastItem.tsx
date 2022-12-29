import React, {
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { useDispatch } from 'react-redux';

import { MainContext } from '@_redux/main';
import * as RToast from '@radix-ui/react-toast';

import { ToastItemProps } from './types';

export default function ToastItem(props: ToastItemProps) {
  const dispatch = useDispatch()

  // main context
  const {
    ffHoveredItem, setFFHoveredItem, ffHandlers, ffTree, updateFF,
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,
    command, setCommand,
    pending, setPending, messages, addMessage, removeMessage,
  } = useContext(MainContext)

  const { index, title, description } = useMemo(() => props, [props])

  const [open, setOpen] = useState(true)

  const handlerClose = useCallback((open: boolean) => {
    if (!open) {
      removeMessage(index)
      setOpen(false)
    }
  }, [index])

  return <>
    <RToast.Root className='rtoast-root' open={open} onOpenChange={handlerClose}>
      <RToast.Title className='rtoast-title' >{title}</RToast.Title>
      <RToast.Description className='rtoast-description'>{description}</RToast.Description>
      <RToast.Close aria-label="Close">
        <span aria-hidden>x</span>
      </RToast.Close>
    </RToast.Root>
  </>
}