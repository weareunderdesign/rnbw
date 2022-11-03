import { TemplateReducer } from '@redux/template';
import { combineReducers } from '@reduxjs/toolkit';

const template = { template: TemplateReducer }

let rootReducer = combineReducers({
  ...template,
})

export default function createReducer(injectedReducers = {}) {
  rootReducer = combineReducers({
    ...template,
    ...injectedReducers,
  });

  return rootReducer;
}

export type AppState = ReturnType<typeof rootReducer>