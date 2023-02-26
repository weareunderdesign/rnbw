import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { IFrameProps } from './types';

export const IFrame = (props: IFrameProps) => {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)
  const htmlNode = contentRef?.contentWindow?.document.documentElement
  const bodyNode = contentRef?.contentWindow?.document.body

  return (
    <iframe
      {...props}
      ref={setContentRef}
      style={{ position: "absolute", width: "100%", height: "100%" }}
    >
      {/* {docNode && createPortal(props.children, dom.createDocumentFragment(), 'stage')} */}
      {/* {htmlNode && createPortal(props.children, htmlNode)} */}
      {bodyNode && createPortal(props.children, bodyNode)}
    </iframe>
  )
}