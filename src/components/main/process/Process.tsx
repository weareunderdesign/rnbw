import React, { useMemo } from "react";

import { ProcessProps } from "./types";

import {
  useAppTitle,
  useProcessorUpdateOpt,
  useProcessorNodeTree,
  useProcessorValidNodeTree,
  useSaveCommand,
} from "./hooks";

export default function Process(props: ProcessProps) {
  // set app title
  useAppTitle();

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
