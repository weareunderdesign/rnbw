import React, { useMemo } from "react";

import {
  useProcessorNodeTree,
  useProcessorUpdate,
  useProcessorValidNodeTree,
  useSaveCommand,
} from "./hooks";
import { ProcessProps } from "./types";

export default function Processor(props: ProcessProps) {
  // processor-update
  useProcessorUpdate();

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
