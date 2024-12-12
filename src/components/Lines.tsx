import React from 'react';
import Line from './Line';
import Circle from './Circle';

interface ClickPosition {
  x: number;
  y: number;
  rowIndex: number;
  cellIndex: number;
}

interface LinesProps {
  clickPositions: ClickPosition[];
}

const Lines: React.FC<LinesProps> = ({ clickPositions }) => {
  const cellPadding = 10; // Cell padding in pixels

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {clickPositions.map((pos, index) => {
        const currCell = document.querySelector(`tbody tr:nth-child(${pos.rowIndex + 1}) td:nth-child(${pos.cellIndex + 2})`);
        if (currCell) {
          const currRect = currCell.getBoundingClientRect();
          const radius = Math.min(currRect.width, currRect.height) * 0.1; // Smaller radius

          return (
            <React.Fragment key={index}>
              {index > 0 && (() => {
                const prevPos = clickPositions[index - 1];
                const prevCell = document.querySelector(`tbody tr:nth-child(${prevPos.rowIndex + 1}) td:nth-child(${prevPos.cellIndex + 2})`);
                if (prevCell) {
                  const prevRect = prevCell.getBoundingClientRect();
                  return (
                    <Line
                      x1={prevRect.left + prevPos.x + window.scrollX}
                      y1={prevRect.top + prevRect.height / 2 + window.scrollY - cellPadding}
                      x2={currRect.left + pos.x + window.scrollX}
                      y2={currRect.top + currRect.height / 2 + window.scrollY - cellPadding}
                    />
                  );
                }
                return null;
              })()}
              <Circle
                cx={currRect.left + pos.x + window.scrollX}
                cy={currRect.top + currRect.height / 2 + window.scrollY - cellPadding}
                r={radius}
              />
            </React.Fragment>
          );
        }
        return null;
      })}
    </svg>
  );
};

export default Lines;