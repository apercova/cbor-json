import React from 'react';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  message: string;
  className?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message, className = '' }) => {
  return (
    <div className={`conversion-loading ${className}`} role="status" aria-live="polite" aria-atomic="true">
      <div className="loading-bar" role="progressbar" aria-label={message} aria-valuetext="In progress">
        <div className="loading-progress"></div>
      </div>
      <span className="loading-text">{message}</span>
    </div>
  );
};

export default LoadingIndicator;
