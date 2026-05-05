/**
 * Quadrilateral Component - React 18 Optimized
 * 
 * Main component that renders quadrilaterals on a grid with:
 * - Draggable vertices (HotspotComponent)
 * - Sides and diagonals (LineComponent)
 * - Angle markers (AngleMarkerComponent)
 * - Property indicators (PropertyIndicatorComponent)
 * - Property panel (PropertyPanelComponent)
 */

// Dependencies: React, QuadrilateralConfig, HotspotComponent, LineComponent, 
// AngleMarkerComponent, PropertyIndicatorComponent, PropertyPanelComponent

/**
 * Quadrilateral Component
 * @param {Object} props - Component props
 * @param {string} props.id - Component ID
 * @param {string} props.elementName - Element name
 * @param {number} props.currentPage - Current page number
 * @param {Array<number>} props.coordinates - Container coordinates [x1, y1, x2, y2]
 * @param {number} props.zIndex - Base z-index
 * @param {string} props.quadType - Type of quadrilateral (default: 'square')
 * @param {Array<number>} props.vertices - Custom vertex coordinates [x1,y1,x2,y2,x3,y3,x4,y4]
 * @param {boolean} props.showGrid - Display background grid (default: true)
 * @param {number} props.gridSize - Grid cell count (default: 20)
 * @param {boolean} props.showDiagonals - Show diagonals (default: false)
 * @param {boolean} props.showProperties - Show visual property indicators (default: true)
 * @param {boolean} props.showPropertyPanel - Show text property panel (default: true)
 * @param {boolean} props.showAngleMarkers - Show angle markers (default: true)
 * @param {boolean} props.showVertices - Show vertex hotspots (default: true)
 * @param {boolean} props.enableDragging - Enable vertex dragging (default: true)
 * @param {string} props.sideColor - Color of sides (default: '#000000')
 * @param {string} props.sideWidth - Width of sides (default: '3gc')
 * @param {string} props.diagonalColor - Color of diagonals (default: '#0066CC')
 * @param {string} props.diagonalWidth - Width of diagonals (default: '2gc')
 * @param {string} props.vertexColor - Color of vertices (default: '#FF6600')
 * @param {string} props.vertexSize - Size of vertex hotspots (default: '25gc')
 * @param {Function} props.onVertexDrag - Callback when vertex is dragged
 * @param {Function} props.onPropertiesChange - Callback when properties change
 */
const QuadrilateralComponent = React.memo((props) => {
  const {
    id,
    elementName,
    currentPage,
    coordinates = [100, 100, 1500, 800],
    zIndex = 50,
    quadType = 'square',
    vertices: customVertices,
    showGrid = true,
    gridSize = 20,
    showDiagonals = false,
    showProperties = true,
    showPropertyPanel = true,
    showAngleMarkers = true,
    showVertices = true,
    enableDragging = true,
    sideColor = '#000000',
    sideWidth = '3gc',
    diagonalColor = '#0066CC',
    diagonalWidth = '2gc',
    diagonalStyle = 'dashed',
    vertexColor = '#FF6600',
    vertexSize = '25gc',
    onVertexDrag,
    onPropertiesChange
  } = props;

  // Get quadrilateral configuration
  const quadConfig = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.QuadrilateralConfig) {
      return window.QuadrilateralConfig.getQuadConfig(quadType);
    }
    return null;
  }, [quadType]);

  // Calculate grid cell size within the quadrilateral container
  const gridCellSize = React.useMemo(() => {
    if (!coordinates || coordinates.length !== 4) return { x: 50, y: 50 };
    
    const [x1, y1, x2, y2] = coordinates;
    const containerWidth = x2 - x1;
    const containerHeight = y2 - y1;
    
    return {
      x: containerWidth / gridSize,
      y: containerHeight / gridSize
    };
  }, [coordinates, gridSize]);

  // Snap a coordinate to the nearest integer grid point (0 to gridSize)
  // The grid is 0-20, so vertices snap to integer coordinates like (0,0), (5,10), (15,20), etc.
  const snapToGrid = React.useCallback((value, cellSize, containerStart) => {
    if (!coordinates || coordinates.length !== 4) return value;
    
    // Calculate relative position within container (from container start)
    const relativePos = value - containerStart;
    
    // Convert to grid coordinate (0 to gridSize)
    const gridCoord = relativePos / cellSize;
    
    // Round to nearest integer grid coordinate (0, 1, 2, ..., gridSize)
    const roundedGridCoord = Math.round(gridCoord);
    
    // Clamp to valid range (0 to gridSize)
    const clampedGridCoord = Math.max(0, Math.min(gridSize, roundedGridCoord));
    
    // Convert back to absolute coordinate
    // This gives us positions at exact grid intersections: containerStart, containerStart+cellSize, containerStart+2*cellSize, etc.
    return containerStart + (clampedGridCoord * cellSize);
  }, [coordinates, gridSize]);

  // Get base vertices (from config or custom)
  const baseVertices = React.useMemo(() => {
    return customVertices || quadConfig?.vertices || [400, 300, 700, 300, 700, 600, 400, 600];
  }, [customVertices, quadConfig]);

  // Initialize vertices state - will be snapped in useEffect
  const [currentVertices, setCurrentVertices] = React.useState(baseVertices);
  
  // Track if we've done initial snap to prevent infinite loops
  const hasSnappedRef = React.useRef(false);
  const lastSnapKeyRef = React.useRef('');

  // Snap vertices to grid whenever base vertices, coordinates, or grid changes
  React.useEffect(() => {
    if (!coordinates || coordinates.length !== 4) {
      return;
    }
    if (!gridCellSize.x || !gridCellSize.y) {
      return;
    }
    
    // Create a unique key for this snap operation
    const snapKey = `${baseVertices.join(',')}-${coordinates.join(',')}-${gridCellSize.x}-${gridCellSize.y}`;
    
    // Skip if we've already snapped with these exact values
    if (hasSnappedRef.current && lastSnapKeyRef.current === snapKey) {
      return;
    }
    
    const [containerX1, containerY1] = coordinates;
    const snappedVertices = [...baseVertices];
    
    // Snap each vertex to nearest grid intersection within the container
    // The grid is relative to the container, so we snap relative to containerX1 and containerY1
    for (let i = 0; i < 4; i++) {
      const oldX = baseVertices[i * 2];
      const oldY = baseVertices[i * 2 + 1];
      
      // Calculate relative position within container
      const relativeX = oldX - containerX1;
      const relativeY = oldY - containerY1;
      
      // Convert to grid coordinate (0 to gridSize)
      const gridX = relativeX / gridCellSize.x;
      const gridY = relativeY / gridCellSize.y;
      
      // Round to nearest integer grid coordinate
      const roundedGridX = Math.round(gridX);
      const roundedGridY = Math.round(gridY);
      
      // Clamp to valid range (0 to gridSize)
      const clampedGridX = Math.max(0, Math.min(gridSize, roundedGridX));
      const clampedGridY = Math.max(0, Math.min(gridSize, roundedGridY));
      
      // Convert back to absolute coordinate
      snappedVertices[i * 2] = containerX1 + (clampedGridX * gridCellSize.x);
      snappedVertices[i * 2 + 1] = containerY1 + (clampedGridY * gridCellSize.y);
    }
    
    // Check if vertices actually changed
    const hasChanged = snappedVertices.some((v, i) => Math.abs(v - currentVertices[i]) > 0.1);
    
    if (hasChanged || !hasSnappedRef.current) {
      hasSnappedRef.current = true;
      lastSnapKeyRef.current = snapKey;
      setCurrentVertices(snappedVertices);
    }
  }, [baseVertices, coordinates, gridCellSize.x, gridCellSize.y, gridSize]); // Removed snapToGrid from dependencies

  // Calculate current properties
  const currentProperties = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.QuadrilateralConfig) {
      return window.QuadrilateralConfig.detectProperties(currentVertices);
    }
    return null;
  }, [currentVertices]);

  // Notify parent of property changes
  React.useEffect(() => {
    if (onPropertiesChange && currentProperties) {
      onPropertiesChange(currentProperties);
    }
  }, [currentProperties, onPropertiesChange]);

  // Handle vertex drag with grid snapping
  const handleVertexDrag = React.useCallback((vertexIndex, newX, newY) => {
    if (!coordinates || coordinates.length !== 4) return;
    
    const [containerX1, containerY1, containerX2, containerY2] = coordinates;
    
    // Snap to nearest grid intersection
    const snappedX = snapToGrid(newX, gridCellSize.x, containerX1);
    const snappedY = snapToGrid(newY, gridCellSize.y, containerY1);
    
    // Clamp to container bounds (should already be clamped by snapToGrid, but double-check)
    const clampedX = Math.max(containerX1, Math.min(containerX2, snappedX));
    const clampedY = Math.max(containerY1, Math.min(containerY2, snappedY));
    
    setCurrentVertices(prev => {
      const newVertices = [...prev];
      newVertices[vertexIndex * 2] = clampedX;
      newVertices[vertexIndex * 2 + 1] = clampedY;
      
      if (onVertexDrag) {
        onVertexDrag(vertexIndex, clampedX, clampedY, newVertices);
      }
      
      return newVertices;
    });
  }, [coordinates, gridCellSize, snapToGrid, onVertexDrag]);

  // Extract vertex coordinates
  const [v1x, v1y, v2x, v2y, v3x, v3y, v4x, v4y] = currentVertices;

  // Calculate position from container coordinates
  const containerPosition = React.useMemo(() => {
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 4) {
      const [x1, y1, x2, y2] = coordinates;
      const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
      const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
      
      const left = ((x1 - 1) / gridCols) * 100;
      const top = ((y1 - 1) / gridRows) * 100;
      const width = ((x2 - x1 + 1) / gridCols) * 100;
      const height = ((y2 - y1 + 1) / gridRows) * 100;
      
      return {
        left: `${left.toFixed(2)}%`,
        top: `${top.toFixed(2)}%`,
        width: `${width.toFixed(2)}%`,
        height: `${height.toFixed(2)}%`
      };
    }
    return {};
  }, [coordinates]);

  // Container style
  const containerStyle = React.useMemo(() => ({
    position: 'absolute',
    ...containerPosition,
    zIndex: zIndex,
    boxSizing: 'border-box'
  }), [containerPosition, zIndex]);

  // Grid background
  const renderGrid = React.useMemo(() => {
    if (!showGrid) return null;

    const gridStyle = {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      backgroundImage: `
        linear-gradient(to right, #e0e0e0 1px, transparent 1px),
        linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)
      `,
      backgroundSize: `${100 / gridSize}% ${100 / gridSize}%`,
      pointerEvents: 'none',
      zIndex: zIndex
    };

    return React.createElement('div', {
      key: 'grid-background',
      className: 'quadrilateral-grid',
      style: gridStyle
    });
  }, [showGrid, gridSize, zIndex]);

  // Render sides (4 lines)
  const renderSides = React.useMemo(() => {
    if (!window.LineComponent) return null;

    const sides = [
      [v1x, v1y, v2x, v2y], // Side 1: vertex 1 to 2
      [v2x, v2y, v3x, v3y], // Side 2: vertex 2 to 3
      [v3x, v3y, v4x, v4y], // Side 3: vertex 3 to 4
      [v4x, v4y, v1x, v1y]  // Side 4: vertex 4 to 1
    ];

    return sides.map((coords, index) => {
      return React.createElement(window.LineComponent.LineComponent, {
        key: `side-${index}`,
        id: `${id}-side-${index}`,
        coordinates: coords,
        lineType: 'slanted',
        borderWidth: sideWidth,
        borderColor: sideColor,
        borderStyle: 'solid',
        zIndex: zIndex + 10
      });
    });
  }, [v1x, v1y, v2x, v2y, v3x, v3y, v4x, v4y, sideColor, sideWidth, zIndex, id]);

  // Render diagonals (2 lines)
  const renderDiagonals = React.useMemo(() => {
    if (!showDiagonals || !window.LineComponent) return null;

    const diagonals = [
      [v1x, v1y, v3x, v3y], // Diagonal 1: vertex 1 to 3
      [v2x, v2y, v4x, v4y]  // Diagonal 2: vertex 2 to 4
    ];

    return diagonals.map((coords, index) => {
      return React.createElement(window.LineComponent.LineComponent, {
        key: `diagonal-${index}`,
        id: `${id}-diagonal-${index}`,
        coordinates: coords,
        lineType: 'slanted',
        borderWidth: diagonalWidth,
        borderColor: diagonalColor,
        borderStyle: diagonalStyle,
        zIndex: zIndex + 5
      });
    });
  }, [showDiagonals, v1x, v1y, v2x, v2y, v3x, v3y, v4x, v4y, diagonalColor, diagonalWidth, diagonalStyle, zIndex, id]);

  // Render vertices (4 hotspots)
  const renderVertices = React.useMemo(() => {
    if (!showVertices || !window.HotspotComponent) return null;

    const vertexCoords = [
      [v1x, v1y],
      [v2x, v2y],
      [v3x, v3y],
      [v4x, v4y]
    ];

    return vertexCoords.map((coords, index) => {
      // Create small coordinates for each hotspot (single point)
      const [vx, vy] = coords;
      const hotspotCoords = [vx, vy, vx + 1, vy + 1];

      return React.createElement(window.HotspotComponent.HotspotComponent, {
        key: `vertex-${index}`,
        id: `${id}-vertex-${index}`,
        coordinates: hotspotCoords,
        size: vertexSize,
        backgroundColor: vertexColor,
        borderColor: vertexColor,
        borderWidth: '2gc',
        innerCircleSize: '8gc',
        animated: false,
        cursor: enableDragging ? 'move' : 'default',
        zIndex: zIndex + 20,
        onMouseDown: enableDragging ? ((e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const startX = e.clientX;
          const startY = e.clientY;
          const originalVx = coords[0];
          const originalVy = coords[1];

          const handleMouseMove = (moveEvent) => {
            moveEvent.preventDefault();
            
            const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
              GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
            const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
              GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
            
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            
            const gridDeltaX = (deltaX / viewportWidth) * gridCols;
            const gridDeltaY = (deltaY / viewportHeight) * gridRows;
            
            const newVx = originalVx + gridDeltaX;
            const newVy = originalVy + gridDeltaY;
            
            handleVertexDrag(index, newVx, newVy);
          };

          const handleMouseUp = (upEvent) => {
            upEvent.preventDefault();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }) : undefined
      });
    });
  }, [v1x, v1y, v2x, v2y, v3x, v3y, v4x, v4y, vertexColor, vertexSize, showVertices, enableDragging, zIndex, id, handleVertexDrag]);

  // Render angle markers
  const renderAngleMarkers = React.useMemo(() => {
    if (!showAngleMarkers || !window.AngleMarkerComponent || !currentProperties) return null;

    const vertices = [
      [[v4x, v4y], [v1x, v1y], [v2x, v2y]], // Angle at vertex 1
      [[v1x, v1y], [v2x, v2y], [v3x, v3y]], // Angle at vertex 2
      [[v2x, v2y], [v3x, v3y], [v4x, v4y]], // Angle at vertex 3
      [[v3x, v3y], [v4x, v4y], [v1x, v1y]]  // Angle at vertex 4
    ];

    return vertices.map((vertexData, index) => {
      const [point1, vertex, point2] = vertexData;
      const angle = currentProperties.angles[index];
      const isRightAngle = quadConfig?.properties.rightAngles?.includes(index) || 
                           Math.abs(angle - 90) < 2;
      
      return React.createElement(window.AngleMarkerComponent.AngleMarkerComponent, {
        key: `angle-${index}`,
        id: `${id}-angle-${index}`,
        angle: angle,
        angleType: isRightAngle ? 'right' : (angle < 90 ? 'acute' : 'obtuse'),
        vertexCoords: vertex,
        point1Coords: point1,
        point2Coords: point2,
        showDegrees: true,
        showArc: true,
        arcRadius: '30gc',
        zIndex: zIndex + 15
      });
    });
  }, [showAngleMarkers, currentProperties, v1x, v1y, v2x, v2y, v3x, v3y, v4x, v4y, quadConfig, zIndex, id]);

  // Render property indicators
  const renderPropertyIndicators = React.useMemo(() => {
    if (!showProperties || !window.PropertyIndicatorComponent || !currentProperties) return null;

    const indicators = [];

    // Parallel side indicators
    if (currentProperties.parallelPairs && currentProperties.parallelPairs.length > 0) {
      currentProperties.parallelPairs.forEach((pair, pairIndex) => {
        pair.forEach(sideIndex => {
          const sideCoords = [
            [v1x, v1y, v2x, v2y],
            [v2x, v2y, v3x, v3y],
            [v3x, v3y, v4x, v4y],
            [v4x, v4y, v1x, v1y]
          ][sideIndex];

          indicators.push(
            React.createElement(window.PropertyIndicatorComponent.PropertyIndicatorComponent, {
              key: `parallel-${sideIndex}-${pairIndex}`,
              id: `${id}-parallel-${sideIndex}`,
              indicatorType: 'parallel',
              line1Coords: sideCoords,
              color: '#9933FF',
              markCount: pairIndex + 1,
              zIndex: zIndex + 12
            })
          );
        });
      });
    }

    // Equal side indicators
    if (currentProperties.equalSidePairs && currentProperties.equalSidePairs.length > 0) {
      currentProperties.equalSidePairs.forEach((pair, pairIndex) => {
        if (Array.isArray(pair)) {
          pair.forEach(sideIndex => {
            const sideCoords = [
              [v1x, v1y, v2x, v2y],
              [v2x, v2y, v3x, v3y],
              [v3x, v3y, v4x, v4y],
              [v4x, v4y, v1x, v1y]
            ][sideIndex];

            indicators.push(
              React.createElement(window.PropertyIndicatorComponent.PropertyIndicatorComponent, {
                key: `equal-${sideIndex}-${pairIndex}`,
                id: `${id}-equal-${sideIndex}`,
                indicatorType: 'equal-sides',
                line1Coords: sideCoords,
                color: '#FF6600',
                markCount: pairIndex + 1,
                zIndex: zIndex + 13
              })
            );
          });
        }
      });
    }

    // Perpendicular diagonal indicator
    if (showDiagonals && currentProperties.diagonalsPerpendicular) {
      indicators.push(
        React.createElement(window.PropertyIndicatorComponent.PropertyIndicatorComponent, {
          key: 'perpendicular-diagonals',
          id: `${id}-perpendicular`,
          indicatorType: 'perpendicular',
          line1Coords: [v1x, v1y, v3x, v3y],
          line2Coords: [v2x, v2y, v4x, v4y],
          color: '#CC00CC',
          zIndex: zIndex + 14
        })
      );
    }

    return indicators;
  }, [showProperties, showDiagonals, currentProperties, v1x, v1y, v2x, v2y, v3x, v3y, v4x, v4y, zIndex, id]);

  // Render property panel
  const renderPropertyPanel = React.useMemo(() => {
    if (!showPropertyPanel || !window.PropertyPanelComponent || !quadConfig) return null;

    // Position panel to the right of the quadrilateral
    const [x1, y1, x2, y2] = coordinates;
    const panelWidth = 350;
    const panelCoords = [x2 + 20, y1, x2 + 20 + panelWidth, y2];

    return React.createElement(window.PropertyPanelComponent.PropertyPanelComponent, {
      key: 'property-panel',
      id: `${id}-property-panel`,
      properties: quadConfig.properties,
      quadName: quadConfig.name,
      coordinates: panelCoords,
      zIndex: zIndex + 30
    });
  }, [showPropertyPanel, quadConfig, coordinates, zIndex, id]);

  // Build all children
  const children = React.useMemo(() => {
    const elements = [];
    
    if (renderGrid) elements.push(renderGrid);
    if (renderSides) elements.push(...renderSides);
    if (renderDiagonals) elements.push(...renderDiagonals);
    if (renderPropertyIndicators) elements.push(...renderPropertyIndicators);
    if (renderAngleMarkers) elements.push(...renderAngleMarkers);
    if (renderVertices) elements.push(...renderVertices);
    if (renderPropertyPanel) elements.push(renderPropertyPanel);
    
    return elements;
  }, [renderGrid, renderSides, renderDiagonals, renderPropertyIndicators, renderAngleMarkers, renderVertices, renderPropertyPanel]);

  return React.createElement('div', {
    id: id || `quadrilateral-${quadType}`,
    className: `quadrilateral-component quadrilateral-${quadType}`,
    style: containerStyle,
    'data-element-name': elementName,
    'data-page': currentPage,
    'data-quad-type': quadType
  }, children);
});

// Quadrilateral Element Configuration
const QuadrilateralElement = {
  quadrilateral: {
    type: 'quadrilateral',
    coordinates: [100, 100, 1500, 800],
    zIndex: 50,
    props: {
      componentType: 'QuadrilateralComponent',
      quadType: 'square',
      showGrid: true,
      gridSize: 20,
      showDiagonals: false,
      showProperties: true,
      showPropertyPanel: true,
      showAngleMarkers: true,
      showVertices: true,
      enableDragging: true,
      sideColor: '#000000',
      sideWidth: '3gc',
      diagonalColor: '#0066CC',
      diagonalWidth: '2gc',
      diagonalStyle: 'dashed',
      vertexColor: '#FF6600',
      vertexSize: '25gc'
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('quadrilateral', (props, elementId) => {
      return React.createElement(QuadrilateralComponent, props);
    })
  }
};

// Export to window for global access
if (typeof window !== 'undefined') {
  window.QuadrilateralComponent = {
    QuadrilateralComponent,
    QuadrilateralElement
  };
}

