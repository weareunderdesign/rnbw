import React, { useRef } from "react";
import { useAttributeHandler } from "./hooks/useAttributeHandler";
import { Attribute, SettingsFormProps } from "../settingsPanel/types";
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
    changeAttribute({
      attrName: attribute,
      attrValue: value,
      cb: () => {
        setShowForm(false);
        setAttributes((prev: Attribute) => ({
          [`${attribute}`]: value,
          ...prev,
        }));
      },
    });
  };

  return (
    <form className="settings-item gap-m">
      <div className="action-button" onClick={() => setShowForm(false)}>
        <SVGIconI {...{ class: "icon-xs" }}>cross</SVGIconI>
      </div>

      <input
        style={{ maxWidth: "50px" }}
        ref={attributeRef}
        placeholder="Attribute"
        type="text"
        className="text-s attribute-input"
        onKeyDown={handleKeyDown}
      />

      <input
        ref={valueRef}
        style={{ textAlign: "end" }}
        placeholder="Value"
        className="text-s attribute-input"
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
      />
    </form>
  );
};
