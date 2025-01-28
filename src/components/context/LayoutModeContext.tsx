import React, { createContext, useState, useContext, ReactNode } from "react";

type LayoutMode = "default" | "reversed";

interface LayoutModeContextType {
  layoutMode: LayoutMode;
  toggleLayoutMode: () => void;
}

const LayoutModeContext = createContext<LayoutModeContextType>({
  layoutMode: "default",
  toggleLayoutMode: () => {},
});

export const LayoutModeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("default");

  const toggleLayoutMode = () => {
    setLayoutMode((prev) => (prev === "default" ? "reversed" : "default"));
  };

  return (
    <LayoutModeContext.Provider value={{ layoutMode, toggleLayoutMode }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
        }}
      >
        {children}
      </div>
    </LayoutModeContext.Provider>
  );
};

export const useLayoutMode = () => {
  const context = useContext(LayoutModeContext);
  if (!context) {
    throw new Error("useLayoutMode must be used within a LayoutModeProvider");
  }
  return context;
};
