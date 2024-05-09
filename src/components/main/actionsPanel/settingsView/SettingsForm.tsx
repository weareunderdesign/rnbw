import React, { useRef } from "react";

import { SettingsFormProps } from "../settingsPanel/types";
import { SVGIconI } from "@_components/common";
import useRnbw from "@_services/useRnbw";

export const SettingsForm = ({
  setShowForm,
  setAttributes,
}: SettingsFormProps) => {
  const attributeRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  const rnbw = useRnbw();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (e.target === valueRef.current) {
      handleSubmit();
    } else {
      valueRef.current?.focus();
    }
  };

  const handleSubmit = async () => {
    const attribute = attributeRef.current?.value;
    const value = valueRef.current?.value;

    if (!attribute || value === undefined) return;

    const existingAttributesObj = rnbw.elements.getElementSettings();
    const updatedAttribsObj = await rnbw.elements.updateSettings({
      ...existingAttributesObj,
      [`${attribute}`]: value,
    });
    updatedAttribsObj && setAttributes(updatedAttribsObj);
    setShowForm(false);
  };

  return (
    <form className="settings-item gap-m">
      <div className="action-button" onClick={() => setShowForm(false)}>
        <SVGIconI {...{ class: "icon-xs" }}>raincons/cross</SVGIconI>
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
