import React from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { Spinner } from '@blueprintjs/core';
import ConMenu from '@components/common/contextMenu';
import MainPage from '@pages/main';
import {
  socketGetConnectedSelector,
  socketGetInitedSelector,
  socketGetPendingSelector,
} from '@redux/socket';

// react functional component
export default function App() {
  const dispatch = useDispatch()

  // fetch socket state
  const connected = useSelector(socketGetConnectedSelector)
  const inited = useSelector(socketGetInitedSelector)
  const pending = useSelector(socketGetPendingSelector)

  return <>
    <div style={{
      position: "absolute",

      width: "100%",
      height: "100%",

      background: "rgb(31, 36, 40)",
    }}>
      {false && <ConMenu />}
      {!inited &&
        <Spinner
          intent='danger'
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: "9999",
            background: "rgba(0, 0, 0, 0.5)",
          }}
        />
      }
      {pending &&
        <Spinner
          intent='success'
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: "9999",
          }}
        />
      }
      {connected && <MainPage />}
    </div>
  </>
}
