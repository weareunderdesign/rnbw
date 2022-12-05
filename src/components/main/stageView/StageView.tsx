import React from 'react';

import ReactShadowRoot from 'react-shadow-root';

import {
  Element,
  Frame,
} from '@craftjs/core';

import Viewport from './components/editor/Viewport';
import { Container } from './components/selectors';
import { StageViewProps } from './types';

const styles = `:host {
  display: inline-flex;
}
.component-selected {
  border: 1px solid blue;
}
.component-hovered {
  border: 1px dashed blue;
}
`;

export default function StageView(props: StageViewProps) {
  let sheet;
  let styleSheets;
  sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);
  styleSheets = [sheet];

  return (
    <div className="panel box padding-xs shadow border-left">
      <div className='box border-top border-right border-bottom border-left'>
        <ReactShadowRoot stylesheets={styleSheets}>
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
    </div>
  )
}