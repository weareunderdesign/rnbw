import { removeToast, TToast } from "@src/_redux/main/toasts";
import React, {  useEffect, useState } from "react";
import { SVGIconII } from "../svgIcon";
import { useDispatch } from "react-redux";

const ToastItem: React.FC<TToast & { onCloseToast: () => void }> = ({
  id,
  type,
  message,
  onCloseToast,
}) => {
  const duration = 50000;
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dispatch = useDispatch();

  const getToastIcon = () => {
    switch (type) {
      case 'success': return 'raincons/check-circle';
      case 'danger': return 'raincons/error-circle';
      case 'warning': return 'raincons/warning';
      default: return 'raincons/info-circle';
    }
  };

  const getToastColor = () => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'danger': return '#F44336';
      case 'warning': return '#FFA726';
      default: return '#2196F3';
    }
  };

  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev < 100) return prev + 1;
          clearInterval(timer);
          onCloseToast();
          return prev;
        });
      }, duration / 100);
      return () => clearInterval(timer);
    }
  }, [isPaused, onCloseToast, duration]);

  return (
    <div
      className="toast-container background-secondary"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        margin: '8px 0',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '400px',
        border: `1px solid ${getToastColor()}20`,
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Status Icon */}
      <div style={{ marginRight: '12px', color: getToastColor() }}>
        <SVGIconII className="icon-m">
          {getToastIcon()}
        </SVGIconII>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {/* {title && (
          <div style={{ 
            fontWeight: 600, 
            marginBottom: '4px',
            color: '#ffffff'
          }}>
            {title}
          </div>
        )} */}
        <div style={{ color: '#ffffff', fontWeight: 400, fontSize: "14px" }}>{message}</div>
      </div>

      {/* Close Button */}
      <div
        style={{
          marginLeft: '12px',
          cursor: 'pointer',
          opacity: 0.6,
          transition: 'opacity 0.2s',
          padding: '4px',
        }}
        onClick={() => dispatch(removeToast(id))}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
      >
        <SVGIconII className="icon-s">
          raincons/cross
        </SVGIconII>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          width: `${progress}%`,
          backgroundColor: getToastColor(),
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
};

export default ToastItem;