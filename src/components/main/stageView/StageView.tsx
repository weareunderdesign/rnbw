import React from 'react';

import ReactShadowRoot from 'react-shadow-root';

import {
  Element,
  Frame,
} from '@craftjs/core';

import { Container } from './nodeRenderer';
import { StageViewProps } from './types';
import Viewport from './viewport';

const styles = `
  :host {
    display: inline-flex;
  }
  .rnbwdev-rainbow-component-selected {
    outline: 1px solid blue;
    outline-offset: -1px;
  }
  .rnbwdev-rainbow-component-hovered {
    outline: 1px dashed blue;
    outline-offset: -1px;
  }
`

export default function StageView(props: StageViewProps) {
  const sheet: CSSStyleSheet = new CSSStyleSheet()
  sheet.replaceSync(styles)
  const styleSheets = [sheet]

  return (
    <div className="panel box padding-xs shadow border-left">
      <div className='box border-top border-right border-bottom border-left' style={{ maxHeight: "calc(100vh - 41px - 80px - 12px)", overflow: "auto" }}>
        <ReactShadowRoot stylesheets={styleSheets}>
          <Viewport>
            <Frame>
              <Element
                canvas
                is={Container}

                style={{
                  width: "100%",
                  height: "100%",
                  background: "rgba(255, 255, 255, 1)",
                }}
              >
              </Element>
            </Frame>
          </Viewport>
        </ReactShadowRoot>
      </div>
    </div >
  )
}