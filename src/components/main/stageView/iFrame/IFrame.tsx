import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { IFrameProps } from './types';

export const IFrame = (props: IFrameProps) => {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)
  const mountNode = contentRef?.contentWindow?.document.body

  return (
    <iframe
      {...props}
      ref={setContentRef}
      style={{ position: "absolute", width: "-webkit-fill-available", height: "-webkit-fill-available" }}
    >
      {mountNode && createPortal(props.children, mountNode)}
    </iframe>
  )
}