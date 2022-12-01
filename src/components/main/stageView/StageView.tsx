import React from 'react';

import ReactShadowRoot from 'react-shadow-root';

import {
  Element,
  Frame,
} from '@craftjs/core';

import Viewport from './components/editor/Viewport';
import { Container } from './components/selectors';
import { StageViewProps } from './types';

// const colors = [
//   'black', 'red', 'rebeccapurple', 'blue', 'brown',
//   'lime', 'magenta', 'green', 'orange', 'teal'
// ];
// const styles = `:host {
//   display: inline-flex;
// }
// span {
//   background-color: var(--color);
//   border-radius: 3px;
//   color: #fff;
//   padding: 1px 5px;
// }
// button {
//   background-color: #fff;
//   border: 1px solid var(--color);
//   border-radius: 3px;
//   color: var(--color);
//   cursor: pointer;
//   outline: 0;
// }
// button:active {
//   background-color: var(--color);
//   color: #fff;
// }
// button,
// span {
//   margin: 0 2px;
// }`;

export default function StageView(props: StageViewProps) {
  // let sheet;
  // let styleSheets;
  // sheet = new CSSStyleSheet();
  // sheet.replaceSync(styles);
  // styleSheets = [sheet];

  return (
    <div style={{
      width: "calc(100% - 700px)",
      height: "100%",
      overflow: "auto",
      backgroundColor: "white"
    }}>
      <ReactShadowRoot>
        <Viewport>
          <Frame>
            <Element
              canvas
              is={Container}
              width="100%"
              height="100%"
              background={{ r: 255, g: 255, b: 255, a: 1 }}
              custom={{ displayName: 'App' }}
            >
            </Element>
          </Frame>
        </Viewport>
      </ReactShadowRoot>
    </div>
  )
}