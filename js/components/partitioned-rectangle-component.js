/**
 * Partitioned Rectangle Component - React 18 Optimized
 * 
 * This file contains the partitioned rectangle component with Suspense boundaries
 */

// Dependencies: SharedUtilities, GridCellFontUtils should be loaded before this file

/**
 * Partitioned Rectangle Component with Suspense boundaries
 */
const PartitionedRectangleComponent = React.memo((props) => {
  const elementId = React.useId();
  
  return React.createElement(window.SharedUtilities?.SuspenseElementWrapper || React.Suspense, {
    elementType: 'partitioned rectangle',
    fallback: React.createElement('div', {
      className: 'partitioned-rectangle-loading-fallback'
    }, 'Loading partitioned rectangle...')
  }, React.createElement('div', {
    id: elementId,
    className: 'partitioned-rectangle-container',
    style: GridCellFontUtils.processGcStyles(props),
    'data-element-type': 'partitioned-rectangle'
  }, 'Partitioned Rectangle Content'));
});

// Partitioned Rectangle Element Configuration
const PartitionedRectangleElement = {
  partitionedRectangle: {
    type: 'partitioned-rectangle',
    coordinates: [20, 20, 80, 60],
    zIndex: 'var(--z-content)',
    props: {
      // Grid structure definition - flexible row/column system
      gridStructure: {
        rows: [
          { columns: 4, height: '1fr' },
          { columns: 3, height: '1fr' },  
          { columns: 5, height: '1fr' }
        ]
      },
      
      // Individual cell configurations (optional)
      cellConfigs: {
        '1-1': { backgroundColor: '#ff6b6b', id: 'cell-top-left' },
        '1-2': { backgroundColor: '#4ecdc4', id: 'cell-top-center-1' },
        '2-1': { backgroundColor: '#45b7d1', id: 'cell-middle-left' },
        '3-3': { backgroundColor: '#96ceb4', id: 'cell-bottom-center' }
      },
      
      // Default cell styling
      defaultCellStyle: {
        backgroundColor: '#f0f0f0',
        color: '#333',
        fontSize: '14px',
        fontWeight: 'normal'
      },
      
      // Container border properties
      containerBorder: {
        color: '#ffffff',
        width: '3px',
        style: 'solid'
      },
      
      // Interactive properties
      clickable: true,
      hoverable: true,
      
      // Event handlers
      onCellClick: null,
      onCellHover: null,
      onCellDoubleClick: null
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('partitioned-rectangle', (props, elementId) => {
      return React.createElement(PartitionedRectangleComponent, props);
    })
  }
};

// Export component and configuration
window.PartitionedRectangleComponent = {
  PartitionedRectangleComponent,
  PartitionedRectangleElement
};

console.log('✅ Partitioned rectangle component loaded successfully');
