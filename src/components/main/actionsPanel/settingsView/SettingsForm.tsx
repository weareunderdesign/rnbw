import React, { useRef, useState } from "react";

import { SettingsFormProps } from "../settingsPanel/types";
import { SVGIconI } from "@_components/common";
import useRnbw from "@_services/useRnbw";

export const SettingsForm = ({
  setShowForm,
  setAttributes,
}: SettingsFormProps) => {
  const attributeRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const [isAttributeHovered, setIsAttributeHovered] = useState(false);
  const [isValueHovered, setIsValueHovered] = useState(false);
  const [isAttributeFocused, setIsAttributeFocused] = useState(false);
  const [isValueFocused, setIsValueFocused] = useState(false);

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
      settings: {
        ...existingAttributesObj,
        [`${attribute}`]: value,
      },
    });
    updatedAttribsObj?.settings && setAttributes(updatedAttribsObj?.settings);
    setShowForm(false);
  };

  const buttonStyle: React.CSSProperties = {
    padding: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  };

  const formStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateRows: '20px 50px 1fr',
    alignItems: 'center',
    gap: '12px',
  };

  const inputStyle: React.CSSProperties = {
    wordWrap: 'break-word',
    background: 'transparent',
    outline: 'none',
    border: 'none',
    width: '100%',
    display: 'inline-block',
    padding: 0,
  };

  return (
    <form style={formStyle}>
      <div style={buttonStyle} onClick={() => setShowForm(false)}>
        <SVGIconI {...{ class: "icon-xs" }}>raincons/cross</SVGIconI>
      </div>

      <input
        style={{
          ...inputStyle,
          maxWidth: "50px",
          boxShadow: isAttributeHovered
            ? '0 2px 0 0 var(--color-tertiary-background)'
            : isAttributeFocused
            ? '0 1px 0 0 var(--color-tertiary-background)'
            : 'none',
        }}
        ref={attributeRef}
        placeholder="Attribute"
        type="text"
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsAttributeHovered(true)}
        onMouseLeave={() => setIsAttributeHovered(false)}
        onFocus={() => setIsAttributeFocused(true)}
        onBlur={() => setIsAttributeFocused(false)}
      />

      <input
        ref={valueRef}
        style={{
          ...inputStyle,
          textAlign: "end",
          boxShadow: isValueHovered
            ? '0 2px 0 0 var(--color-tertiary-background)'
            : isValueFocused
            ? '0 1px 0 0 var(--color-tertiary-background)'
            : 'none',
        }}
        placeholder="Value"
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        onMouseEnter={() => setIsValueHovered(true)}
        onMouseLeave={() => setIsValueHovered(false)}
        onFocus={() => setIsValueFocused(true)}
      />
    </form>
  );
};