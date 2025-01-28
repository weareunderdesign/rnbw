import React from 'react';
import ToastList from './ToastList';



export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <React.Fragment>
      {children}
      <ToastList />
    </React.Fragment>
  );
};
