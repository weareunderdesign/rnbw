import React from "react";
import { SVGIcon } from "@src/components";

export interface ParsingError {
  message: string;
  line: number;
  column: number;
  source?: string;
}

interface ParsingErrorsPanelProps {
  errors: ParsingError[];
  onErrorClick: (line: number, column: number) => void;
}

const panelStyle: React.CSSProperties = {
  height: "100%",
  overflow: "auto",
  background: "var(--background-secondary)",
  boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
};

const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "var(--background-secondary)",
  borderBottom: "1px solid var(--border)",
  zIndex: 1,
};

export const ParsingErrorsPanel: React.FC<ParsingErrorsPanelProps> = ({
  errors,
  onErrorClick,
}) => {
  if (errors.length === 0) return null;

  return (
    <div style={panelStyle}>
      <div style={headerStyle} className="padding-s">
        <div className="flex gap-s align-center">
          <SVGIcon name="cross" className="icon-s background-negative" />
          <span className="color-tertiary">
            Parsing Errors ({errors.length})
          </span>
        </div>
      </div>

      {errors.map((error, index) => (
        <div
          key={index}
          className="cursor-pointer padding-m hover-background-tertiary border-bottom"
          onClick={() => onErrorClick(error.line, error.column)}
        >
          <div className="flex column gap-xs">
            <span className="color-error">{error.message}</span>
            <span className="color-tertiary text-s">
              Line {error.line}, Column {error.column}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
