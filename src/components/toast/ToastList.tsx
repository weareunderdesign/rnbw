import React from "react";
import ToastItem from "./ToastItem";
import { removeToast } from "@src/_redux/main/toasts";
import { AppState } from "@src/_redux/_root";
import { useDispatch, useSelector } from "react-redux";

const ToastList: React.FC = () => {
  const { records } = useSelector((state: AppState) => state.main.feedBack);
  const dispatch = useDispatch();
  const toastListStyle: React.CSSProperties = {
    position: "fixed",
    left: "50%",
    bottom: "20px",
    transform: "translateX(-50%)",
    // width: "200px",
    maxWidth: "90%",
    overflow: "hidden",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  return (
    <div
      style={toastListStyle}
      className="animate duration-slow ease-in-out fade-out"
    >
      {records.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          title={toast.title}
          type={toast.type}
          message={toast.message}
          onCloseToast={() => {
            if (toast.id) {
              dispatch(removeToast(toast.id));
            }
          }}
        />
      ))}
    </div>
  );
};

export default ToastList;
