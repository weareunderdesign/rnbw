import React from 'react';
// import CustomizeIcon from 'src/arrow.svg';

export type SidebarItemProps = {
  title: string;
  height?: string;
  icon: string;
  visible?: boolean;
  onChange?: (bool: boolean) => void;
  children?: any,
};

export const SidebarItem: React.FC<SidebarItemProps> = ({
  visible,
  icon,
  title,
  children,
  height,
  onChange,
}) => {
  return (
    <div className="flex flex-col" style={{
      height: visible && height && height !== 'full' ? `${height}` : 'auto',
      flex: visible && height && height === 'full' ? `1` : 'unset',
      color: "#545454"
    }}>
      <div
        onClick={() => {
          if (onChange) onChange(!visible);
        }}
        className={`cursor-pointer bg-white border-b last:border-b-0 flex items-center px-2 ${visible ? 'shadow-sm' : ''
          }`}
        style={{
          color: "#615c5c",
          height: "45px",
        }}
      >
        <div className="flex-1 flex items-center">
          {/* <CustomizeIcon></CustomizeIcon> */}
          <h2 className="text-xs uppercase">{title}</h2>
        </div>
      </div>
      {visible ? (
        <div className="w-full flex-1 overflow-auto">{children}</div>
      ) : null}
    </div>
  );
};
