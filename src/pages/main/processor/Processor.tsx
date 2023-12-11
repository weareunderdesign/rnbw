import React from "react";

import {
  useFileTreeEvent,
  useHms,
  useNodeTreeEvent,
  useSaveCommand,
} from "./hooks";

const Processor = () => {
  useHms();
  useFileTreeEvent();
  useNodeTreeEvent();
  useSaveCommand();
  return <></>;
};

export default Processor;
