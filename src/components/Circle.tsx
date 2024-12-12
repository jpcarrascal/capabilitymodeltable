import React from 'react';

interface CircleProps {
  cx: number;
  cy: number;
  r: number;
}

const Circle: React.FC<CircleProps> = ({ cx, cy, r }) => {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="black"
    />
  );
};

export default Circle;