import React, { useState } from 'react';
import * as RToast from '@radix-ui/react-toast';
import { ToastItemProps } from './types';
import { useDispatch } from 'react-redux';
import * as Main from '@_redux/main';


export default function ToastItem(props: ToastItemProps) {
    const { index, title, description } = props
    const dispatch = useDispatch()
    const [open, setOpen] = useState(true);

    const handlerClose = (open: boolean) => {
        dispatch(Main.updateGlobalError(index))
        setOpen(open)
    }

    return <>
        <RToast.Root className='rtoast-root' open={open} onOpenChange={handlerClose}>
            <RToast.Title className='rtoast-title' >{title} {index}</RToast.Title>
            <RToast.Description className='rtoast-description'>{description}</RToast.Description>
            <RToast.Close aria-label="Close">
                <span aria-hidden>×</span>
            </RToast.Close>
        </RToast.Root>
    </>
}