import React, { useRef } from "react";
import { useAttributeHandler } from "./hooks/useAttributeHandler";
import { SettingsFormProps } from "../settingsPanel/types";
import { SVGIconI } from "@_components/common";

export const SettingsForm = ({
  setShowForm,
  setAttributes,
}: SettingsFormProps) => {
  const attributeRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  const { changeAttribute } = useAttributeHandler();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (e.target === valueRef.current) {
      handleSubmit();
    } else {
      valueRef.current?.focus();
    }
  };

  const handleSubmit = () => {
    const attribute = attributeRef.current?.value;
    const value = valueRef.current?.value;

    if (!attribute || value === undefined) return;
    changeAttribute(attribute, value, () => {
      setShowForm(false);
      setAttributes((prev: Record<string, string>) => ({
        [`${attribute}`]: value,
        ...prev,
      }));
    });
  };

  return (
    <form className="settings-item gap-m">
      <input
        ref={attributeRef}
        placeholder="Attribute"
        type="text"
        className="text-s attribute-input"
        onKeyDown={handleKeyDown}
      />

      <input
        ref={valueRef}
        placeholder="Value"
        className="text-s attribute-input"
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
      />
      <div className="action-button" onClick={() => setShowForm(false)}>
        <SVGIconI {...{ class: "icon-xs" }}>cross</SVGIconI>
      </div>
    </form>
  );
};
