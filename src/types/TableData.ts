// src/types/TableData.ts
export interface TableData {
  headers: string[];
  rows: {
    label: string;
    data: string[];
    currentState?: {
      x: number;
      y: number;
      cellIndex: number;
    };
    aspirationalState?: {
      x: number;
      y: number;
      cellIndex: number;
    };
  }[];
}