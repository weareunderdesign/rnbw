import React, {
  useEffect,
  useRef,
} from 'react';

import {
  ContextMenu,
  Menu,
  MenuItem,
} from '@blueprintjs/core';

export default function ConMenu(props: any): JSX.Element {
  const playground = useRef(null)
  const handleSave = () => {
  }
  const handleDelete = () => {
  }
  useEffect(() => {
    if (playground.current) {
      (playground.current as HTMLElement).oncontextmenu = (e: MouseEvent) => {
        // prevent the browser's native context menu
        e.preventDefault();

        // render a Menu without JSX...
        const menu = React.createElement(
          Menu,
          {}, // empty props
          React.createElement(MenuItem, { onClick: handleSave, text: "Save" }),
          React.createElement(MenuItem, { onClick: handleDelete, text: "Delete" }),
        );

        // mouse position is available on event
        ContextMenu.show(menu, { left: e.clientX, top: e.clientY }, () => {
          // menu was closed; callback optional
        });
      };
    }
  }, [playground])

  return <>
    <div
      style={{
        width: "200px",
        height: "200px",
        background: "green",
      }}
      ref={playground}
    ></div>
  </>
}