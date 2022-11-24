import React, { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { globalGetCurrentFileSelector } from '@_redux/global';

import { StageViewProps } from './types';

// import lz from "lzutf8";
// import copy from 'copy-to-clipboard';

export default function StageView(props: StageViewProps) {
  const { uid, type, content } = useSelector(globalGetCurrentFileSelector)
  const codeContent = useMemo(() => {
    return content
  }, [content])

  return <>
  </>
}