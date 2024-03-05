import React, { useRef } from "react";
import { useAttributeHandler } from "./hooks/useAttributeHandler";

export const SettingsForm = ({ setShowForm }: { setShowForm: any }) => {
  const attributeRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const { changeAttribute } = useAttributeHandler();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    if (event.target === valueRef.current) {
      handleSubmit();
    } else {
      valueRef.current?.focus();
    }
  };

  const handleSubmit = () => {
    const attribute = attributeRef.current?.value;
    const value = valueRef.current?.value;

    if (!attribute || value === undefined) return;
    changeAttribute(attribute, value, () => setShowForm(false));
  };

  return (
    <form className="flex align-center justify-start gap-s p">
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
    </form>
  );
};
