import React from 'react';

interface LineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const Line: React.FC<LineProps> = ({ x1, y1, x2, y2 }) => {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="black"
      strokeWidth="2"
    />
  );
};

export default Line;