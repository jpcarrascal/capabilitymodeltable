// src/components/Table.tsx
import React, { useEffect, useState, useRef } from 'react';
import { TableData } from '../types/TableData';
import './Table.css';

interface ClickPosition {
  rowIndex: number;
  cellIndex: number;
}

const Table: React.FC = () => {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [, forceUpdate] = useState({});

  // Refs to table cells
  const cellRefs = useRef<HTMLTableCellElement[][]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/table.json')
      .then((response) => response.json())
      .then((data: TableData) => setTableData(data));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      forceUpdate({});
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCellClick = (
    event: React.MouseEvent<HTMLTableCellElement>,
    rowIndex: number,
    cellIndex: number
  ) => {
    const cell = event.currentTarget;
    const rect = cell.getBoundingClientRect();

    // Get the table container's bounding rectangle
    const containerRect = tableContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Calculate x and y relative to the container
    const x = rect.left + rect.width / 2 - containerRect.left;
    const y = rect.top + rect.height / 2 - containerRect.top;

    setTableData((prevData) => {
      if (!prevData) return prevData;
      const newData = { ...prevData };
      newData.rows[rowIndex].currentState = { x, y, cellIndex };
      return newData;
    });
  };

  const saveStateToFile = () => {
    if (!tableData) return;
    const json = JSON.stringify(tableData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tableData.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadStateFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      const data = JSON.parse(json) as TableData;
      setTableData(data);
    };
    reader.readAsText(file);
  };

  if (!tableData) {
    return <div>Loading...</div>;
  }

  const headerColors = ['violet', 'magenta', 'teal', 'cyan', 'green'];

  const clickPositions: ClickPosition[] = tableData.rows
    .map((row, rowIndex) =>
      row.currentState ? { cellIndex: row.currentState.cellIndex, rowIndex } : null
    )
    .filter((pos): pos is ClickPosition => pos !== null);

  return (
    <div className="table-container" ref={tableContainerRef}>
      <button onClick={saveStateToFile}>Save State</button>
      <input type="file" accept="application/json" onChange={loadStateFromFile} />
      <table>
        <thead>
          <tr>
            <th></th>
            {tableData.headers.map((header, index) => (
              <th
                key={index}
                style={{ backgroundColor: headerColors[index], textAlign: 'center' }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rowIndex) => {
            if (!cellRefs.current[rowIndex]) {
              cellRefs.current[rowIndex] = [];
            }
            return (
              <tr key={rowIndex}>
                <td style={{ textAlign: 'center' }}>{row.label}</td>
                {row.data.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    ref={(el) => {
                      if (el) {
                        cellRefs.current[rowIndex][cellIndex] = el;
                      }
                    }}
                    style={{
                      position: 'relative',
                      verticalAlign: 'top',
                      textAlign: 'left',
                    }}
                    onClick={(e) => handleCellClick(e, rowIndex, cellIndex)}
                  >
                    {cell}
                    {row.currentState && row.currentState.cellIndex === cellIndex && (
                      <div
                        className="circle"
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: 'black',
                        }}
                      ></div>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <svg className="lines-svg">
        {clickPositions.map((pos, index) => {
          if (index > 0) {
            const prevPos = clickPositions[index - 1];

            const prevCell = cellRefs.current[prevPos.rowIndex]?.[prevPos.cellIndex];
            const currCell = cellRefs.current[pos.rowIndex]?.[pos.cellIndex];

            if (prevCell && currCell && tableContainerRef.current) {
              const containerRect = tableContainerRef.current.getBoundingClientRect();
              const prevRect = prevCell.getBoundingClientRect();
              const currRect = currCell.getBoundingClientRect();

              const prevX =
                prevRect.left + prevRect.width / 2 - containerRect.left;
              const prevY =
                prevRect.top + prevRect.height / 2 - containerRect.top;
              const currX =
                currRect.left + currRect.width / 2 - containerRect.left;
              const currY =
                currRect.top + currRect.height / 2 - containerRect.top;

              return (
                <line
                  key={index}
                  x1={prevX}
                  y1={prevY}
                  x2={currX}
                  y2={currY}
                  stroke="black"
                  strokeWidth="2"
                />
              );
            }
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export default Table;