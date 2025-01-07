// src/components/Table.tsx
import React, { useEffect, useState, useRef } from 'react';
import { TableData } from '../types/TableData';
import './Table.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ClickPosition {
  rowIndex: number;
  cellIndex: number;
}

type SelectionMode = 'current' | 'aspirational';

const Table: React.FC = () => {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('current');
  const [, forceUpdate] = useState({});
  const [stateHistory, setStateHistory] = useState<TableData[]>([]);
  
  // Add useEffect to capture initial state
  // useEffect(() => {
  //   if (tableData) {
  //     setStateHistory([JSON.parse(JSON.stringify(tableData))]);
  //   }
  // }, []); // Run once on mount

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
    const containerRect = tableContainerRef.current?.getBoundingClientRect();
    if (!containerRect || !tableData) return;

    // Create snapshot before any updates
    const snapshot = JSON.parse(JSON.stringify(tableData));
        
    // Save snapshot to history
    setStateHistory(prev => [...prev, snapshot]);

    const x = rect.left + rect.width / 2 - containerRect.left;
    const y = rect.top + rect.height / 2 - containerRect.top;

    setTableData((prevData) => {
      if (!prevData) return prevData;
      const newData = { ...prevData };
      if (selectionMode === 'current') {
        newData.rows[rowIndex].currentState = { x, y, cellIndex };
      } else {
        newData.rows[rowIndex].aspirationalState = { x, y, cellIndex };
      }
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

  // Add helper function to get cell center coordinates
  const getCellCenter = (cellElement: HTMLTableCellElement) => {
    const rect = cellElement.getBoundingClientRect();
    const containerRect = tableContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;

    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top
    };
  };

  // Add this function inside the Table component
  const exportToPDF = async () => {
    if (!tableContainerRef.current) return;

    try {
      // Create canvas from table
      const options: Parameters<typeof html2canvas>[1] = {
        width: window.innerWidth,
        height: window.innerHeight,
        useCORS: true,
        logging: false,
        background: '#ffffff'
      };

      const canvas = await html2canvas(tableContainerRef.current, options);

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('capability-model.pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  const handleUndo = () => {
    if (stateHistory.length > 0) {
      // Get the last state
      const previousState = stateHistory[stateHistory.length - 1];
      // Remove the last state from history
      setStateHistory(prev => prev.slice(0, -1));
      // Restore the previous state
      setTableData(previousState);
    }
  };

  if (!tableData) {
    return <div>Loading...</div>;
  }

  // const headerColors = ['violet', 'magenta', 'teal', 'cyan', 'green'];

  const headerColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#22c55e'  // Green
  ];

  const clickPositions: ClickPosition[] = tableData.rows
    .map((row, rowIndex) =>
      row.currentState ? { cellIndex: row.currentState.cellIndex, rowIndex } : null
    )
    .filter((pos): pos is ClickPosition => pos !== null);

  return (
    <div className="table-container" ref={tableContainerRef}>
      <div className="controls">
        <label>
          <input
            type="radio"
            value="current"
            checked={selectionMode === 'current'}
            onChange={(e) => setSelectionMode(e.target.value as SelectionMode)}
          /> Current State
        </label>
        <label>
          <input
            type="radio"
            value="aspirational"
            checked={selectionMode === 'aspirational'}
            onChange={(e) => setSelectionMode(e.target.value as SelectionMode)}
          /> Aspirational Goals
        </label>
        <button 
          onClick={handleUndo} 
          disabled={stateHistory.length === 0}
        >
          Undo
        </button>
        <button onClick={exportToPDF}>Export to PDF</button>
      </div>
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
                    className={`
                      ${(row.currentState?.cellIndex === cellIndex || 
                         row.aspirationalState?.cellIndex === cellIndex) ? 
                         'active-cell' : ''}
                    `}
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
                        className="circle current"
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    )}
                    {row.aspirationalState && row.aspirationalState.cellIndex === cellIndex && (
                      <div
                        className="circle aspirational"
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
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

        {/* Add new lines between current and aspirational states */}
        {tableData.rows.map((row, rowIndex) => {
          if (row.currentState && row.aspirationalState) {
            const currentCell = cellRefs.current[rowIndex]?.[row.currentState.cellIndex];
            const aspirationalCell = cellRefs.current[rowIndex]?.[row.aspirationalState.cellIndex];

            if (currentCell && aspirationalCell && tableContainerRef.current) {
              const currentPos = getCellCenter(currentCell);
              const aspirationalPos = getCellCenter(aspirationalCell);

              if (currentPos && aspirationalPos) {
                return (
                  <line
                    key={`state-line-${rowIndex}`}
                    x1={currentPos.x}
                    y1={currentPos.y}
                    x2={aspirationalPos.x}
                    y2={aspirationalPos.y}
                    stroke="#666"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                );
              }
            }
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export default Table;