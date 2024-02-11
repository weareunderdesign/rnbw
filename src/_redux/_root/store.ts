import { createInjectorsEnhancer } from "redux-injectors";
import createSagaMiddleware from "redux-saga";

import { configureStore } from "@reduxjs/toolkit";

import createReducer from "./rootReducer";
import rootSaga from "./rootSaga";

export default function configureAppStore(initialState = {}) {
  const reduxSagaMonitorOptions = {};
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions);

  const { run: runSaga } = sagaMiddleware;
  const enhancers = [
    createInjectorsEnhancer({
      createReducer,
      runSaga,
    }),
  ];

  const store = configureStore({
    reducer: createReducer(),
    middleware: (getDefaultMiddlewares) =>
      getDefaultMiddlewares().concat(sagaMiddleware),
    preloadedState: initialState,
    devTools: process.env.NODE_ENV !== "production",
    enhancers: enhancers as any, // Cast enhancers to 'any' type to bypass the type error
  });

  sagaMiddleware.run(rootSaga);

  return store;
}
