import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import { useDispatch } from 'react-redux';

import * as Main from '@_redux/main';
import * as RToast from '@radix-ui/react-toast';

import { ToastItemProps } from './types';

export default function ToastItem(props: ToastItemProps) {
  const dispatch = useDispatch()

  const { key, title, description } = useMemo(() => props, [props])

  const [open, setOpen] = useState(true)

  const handlerClose = useCallback((open: boolean) => {
    if (!open) {
      dispatch(Main.removeGlobalError(key))
      setOpen(false)
    }
  }, [key])

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