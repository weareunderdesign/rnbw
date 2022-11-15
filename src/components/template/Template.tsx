import React from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  templateFetchRequest,
  templateGetPendingSelector,
  templateGetResponseSelector,
} from '@_redux/template';

export default function Template() {
  const dispatch = useDispatch()
  const pending = useSelector(templateGetPendingSelector)
  const response = useSelector(templateGetResponseSelector)

  return <>
    <div>
      {pending ? <span>Pending...</span> : null}
      <button onClick={() => dispatch(templateFetchRequest({ param1: 1, param2: 2 }))}>
        Fetch
      </button>
    </div>
  </>
}