import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAppState } from "@_redux/useAppState";
import { getSystemTheme } from "@_services/index";

export const Notification = () => {
  const { theme } = useAppState();

  return (
    <ToastContainer
      position="bottom-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      pauseOnHover
      toastClassName="border"
      toastStyle={{ fontSize: "14px" }}
      theme={(theme === "System" ? getSystemTheme() : theme).toLowerCase()}
    />
  );
};
