import './styles.css';

import React from 'react';

import * as RDialog from '@radix-ui/react-dialog';

import { DialogProps } from './types';

export default function Dialog(props: DialogProps) {
  return <>
    <RDialog.Root open={props.open}>
      <RDialog.Portal>
        <RDialog.Overlay onClick={props.onClose} className="rdialog-overlay" />
        <RDialog.Content className="rdialog-content shadow border">
          {props.children}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  </>
}