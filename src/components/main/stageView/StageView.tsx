import React, { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { globalGetCurrentFileSelector } from '@redux/global';

// import lz from "lzutf8";
// import copy from 'copy-to-clipboard';

export default function StageView() {
  const { uid, type, content } = useSelector(globalGetCurrentFileSelector)
  const codeContent = useMemo(() => {
    return content
  }, [content])

  return (
    <div>
    </div>
  )
}