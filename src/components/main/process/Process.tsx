import React, { useMemo } from "react";

import { ProcessProps } from "./types";

import {
  useProcessorUpdateOpt,
  useProcessorNodeTree,
  useProcessorValidNodeTree,
  useSaveCommand,
} from "./hooks";

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
