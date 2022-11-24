import { createInjectorsEnhancer } from 'redux-injectors';
import createSagaMiddleware from 'redux-saga';

import {
  configureStore,
  getDefaultMiddleware,
} from '@reduxjs/toolkit';

import createReducer from './rootReducer';
import rootSaga from './rootSaga';

export default function configureAppStore(initialState = {}) {
  const reduxSagaMonitorOptions = {}
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions)

  const { run: runSaga } = sagaMiddleware

  // sagaMiddleware: Makes redux-sagas work
  const middlewares = [sagaMiddleware]

  const enhancers = [
    createInjectorsEnhancer({
      createReducer,
      runSaga,
    }),
  ]

  const store = configureStore({
    reducer: createReducer(),
    middleware: [...getDefaultMiddleware(), ...middlewares],
    preloadedState: initialState,
    devTools: process.env.NODE_ENV !== 'production',
    enhancers,
  })

  sagaMiddleware.run(rootSaga)
  return store
}