import React from "react";
import { useFileTreeEvent, useHms } from "./hooks";
import { useNodeTreeEvent } from "./hooks";
import { useSaveCommand } from "./hooks";

const Processor = () => {
  useHms();
  useFileTreeEvent();
  useNodeTreeEvent();
  useSaveCommand();
  return <></>;
};

export default Processor;
