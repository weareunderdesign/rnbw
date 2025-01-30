import React, { ReactNode } from "react";

const CodeViewOverlay: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "500px",
          height: "100%",
          zIndex: 9999,
        }}
      >
        {/* ActionsPanel | DesignView Panel | CodeView Overlay*/}
        {children}
      </div>
    </div>
  );
};

export default CodeViewOverlay;
