import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

export default function VirtualizedTable({ 
  rows, 
  columns, 
  rowHeight = 60,
  tableHeight = 400,
  onRowClick,
  ariaLabel = 'Data table'
}) {
  const Row = ({ index, style }) => {
    const row = rows[index];
    return (
      <div
        style={style}
        className="virtualized-table-row"
        onClick={() => onRowClick && onRowClick(row)}
        role="row"
        tabIndex={0}
        aria-label={`Row ${index + 1}`}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
            e.preventDefault();
            onRowClick(row);
          }
        }}
      >
        {columns.map((col, colIndex) => (
          <div
            key={colIndex}
            className="virtualized-table-cell"
            style={{ width: col.width || 'auto', flex: col.flex || 1 }}
            role="gridcell"
          >
            {col.render ? col.render(row, index) : row[col.key]}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className="virtualized-table-container"
      role="table"
      aria-label={ariaLabel}
      aria-rowcount={rows.length}
    >
      <div className="virtualized-table-header" role="rowgroup">
        <div className="virtualized-table-row" role="row">
          {columns.map((col, index) => (
            <div
              key={index}
              className="virtualized-table-header-cell"
              style={{ width: col.width || 'auto', flex: col.flex || 1 }}
              role="columnheader"
              aria-sort={col.sortable ? 'none' : undefined}
            >
              {col.header}
            </div>
          ))}
        </div>
      </div>
      <div className="virtualized-table-body" role="rowgroup">
        <List
          height={tableHeight}
          itemCount={rows.length}
          itemSize={rowHeight}
          width="100%"
        >
          {Row}
        </List>
      </div>
    </div>
  );
}

