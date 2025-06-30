import React from 'react';
import './ZoomContainer.css';

interface ZoomContainerProps {
  zoom: number; // e.g. 0.8, 1, 1.2
  children: React.ReactNode;
}

export const ZoomContainer: React.FC<ZoomContainerProps> = ({ zoom, children }) => (
  <div className="zoom-wrapper">
    <div
      className="zoom-content"
      style={{ transform: `scale(${zoom})` }}
    >
      {children}
    </div>
  </div>
);