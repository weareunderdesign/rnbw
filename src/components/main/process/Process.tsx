import React, { useMemo } from 'react';

import {
  useProcessorNodeTree,
  useProcessorUpdateOpt,
  useProcessorValidNodeTree,
  useSaveCommand,
} from './hooks';
import { ProcessProps } from './types';

export default function Process(props: ProcessProps) {
  // processor-updateOpt
  useProcessorUpdateOpt();

  // processor-nodeTree
  useProcessorNodeTree();

  // processor-validNodeTree
  useProcessorValidNodeTree();

  // cmdk
  useSaveCommand();

  return useMemo(() => {
    return <></>;
  }, []);
}
