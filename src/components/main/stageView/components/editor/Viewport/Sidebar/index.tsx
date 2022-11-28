import { useEditor } from '@craftjs/core';
import React, { useState } from 'react';
import styled from 'styled-components';

import { SidebarItem } from './SidebarItem';

import { Toolbar } from '../../Toolbar';

export const Sidebar = () => {
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return (
    <div className="sidebar transition bg-white w-2" style={{
      width: "280px",
      opacity: enabled ? 1 : 0,
      background: "#fff",
      marginRight: !enabled ? 0 : "-280px"
    }}>
      <div className="flex flex-col h-full">
        <SidebarItem
          title="Customize"
          height='full'
          visible={toolbarVisible}
          onChange={(val) => setToolbarVisible(val)}
          icon={''}>
          <Toolbar />
        </SidebarItem>
      </div>
    </div>
  );
};
