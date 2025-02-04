import eventEmitter from "./eventEmitter";
import { ParsingError } from "@src/features/codeView/ParsingErrorsPanel";

export const emitParsingErrors = (errors: ParsingError[]) => {
  eventEmitter.emit("parseError", errors);
};
