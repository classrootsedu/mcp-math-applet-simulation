/**
 * Property Indicator Component - React 18 Optimized
 * 
 * Visual indicators overlaid on quadrilaterals to show geometric properties:
 * - Parallel marks (arrows/chevrons) on parallel sides
 * - Equal length marks (tick marks) on equal sides
 * - Perpendicular symbols at diagonal intersections
 * - Symmetry lines (dashed overlay)
 */

// Dependencies: React, GridCellFontUtils, gridPositions

/**
 * Property Indicator Component
 * @param {Object} props - Component props
 * @param {string} props.id - Component ID
 * @param {string} props.indicatorType - Type: 'parallel', 'equal-sides', 'perpendicular', 'symmetry'
 * @param {Array<number>} props.line1Coords - [x1, y1, x2, y2] for first line/side
 * @param {Array<number>} props.line2Coords - [x1, y1, x2, y2] for second line (optional)
 * @param {string} props.color - Indicator color (default: '#FF6600')
 * @param {string} props.size - Size in gc units (default: '15gc')
 * @param {number} props.markCount - Number of marks for equal sides (1-3, default: 1)
 * @param {number} props.zIndex - Z-index value (default: 1500)
 */
const PropertyIndicatorComponent = React.memo((props) => {
  const {
    id,
    indicatorType = 'parallel',
    line1Coords = [0, 0, 100, 100],
    line2Coords = null,
    color = '#FF6600',
    size = '15gc',
    markCount = 1,
    zIndex = 1500
  } = props;

  // Process GC units
  const processGcProperty = (value) => {
    if (typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcProperty) {
      return GridCellFontUtils.processGcProperty(value);
    }
    return value;
  };

  const processedSize = processGcProperty(size);

  // Calculate midpoint of a line
  const calculateMidpoint = React.useCallback((coords) => {
    const [x1, y1, x2, y2] = coords;
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }, []);

  // Calculate angle of a line
  const calculateLineAngle = React.useCallback((coords) => {
    const [x1, y1, x2, y2] = coords;
    return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  }, []);

  // Convert grid coordinates to percentage
  const getPercentageCoords = React.useCallback((x, y) => {
    const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
    const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
    
    return {
      left: `${((x - 1) / gridCols) * 100}%`,
      top: `${((y - 1) / gridRows) * 100}%`
    };
  }, []);

  // Render parallel indicator (arrow/chevron)
  const renderParallelIndicator = React.useMemo(() => {
    if (indicatorType !== 'parallel') return null;

    const [midX, midY] = calculateMidpoint(line1Coords);
    const angle = calculateLineAngle(line1Coords);
    const position = getPercentageCoords(midX, midY);

    const sizeValue = parseFloat(processedSize);

    const arrowStyle = {
      position: 'absolute',
      left: position.left,
      top: position.top,
      width: '0',
      height: '0',
      borderLeft: `${sizeValue * 0.4}px solid transparent`,
      borderRight: `${sizeValue * 0.4}px solid transparent`,
      borderBottom: `${sizeValue * 0.6}px solid ${color}`,
      transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
      transformOrigin: 'center center',
      zIndex: zIndex,
      pointerEvents: 'none'
    };

    // Create multiple arrows if markCount > 1
    const arrows = [];
    const spacing = sizeValue * 0.8;
    const totalWidth = (markCount - 1) * spacing;
    
    for (let i = 0; i < markCount; i++) {
      const offset = i * spacing - totalWidth / 2;
      const adjustedStyle = {
        ...arrowStyle,
        transform: `translate(-50%, -50%) rotate(${angle + 90}deg) translateX(${offset}px)`
      };
      
      arrows.push(
        React.createElement('div', {
          key: `arrow-${i}`,
          className: 'property-indicator-arrow',
          style: adjustedStyle
        })
      );
    }

    return arrows;
  }, [indicatorType, line1Coords, color, processedSize, zIndex, markCount, calculateMidpoint, calculateLineAngle, getPercentageCoords]);

  // Render equal sides indicator (tick marks)
  const renderEqualSidesIndicator = React.useMemo(() => {
    if (indicatorType !== 'equal-sides') return null;

    const [midX, midY] = calculateMidpoint(line1Coords);
    const angle = calculateLineAngle(line1Coords);
    const position = getPercentageCoords(midX, midY);

    const sizeValue = parseFloat(processedSize);
    const markLength = sizeValue;
    const markThickness = 2;

    // Create tick marks perpendicular to the line
    const marks = [];
    const spacing = 5;
    const totalWidth = (markCount - 1) * spacing;
    
    for (let i = 0; i < markCount; i++) {
      const offset = i * spacing - totalWidth / 2;
      
      const markStyle = {
        position: 'absolute',
        left: position.left,
        top: position.top,
        width: `${markThickness}px`,
        height: `${markLength}px`,
        backgroundColor: color,
        transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${offset}px)`,
        transformOrigin: 'center center',
        zIndex: zIndex,
        pointerEvents: 'none'
      };
      
      marks.push(
        React.createElement('div', {
          key: `tick-${i}`,
          className: 'property-indicator-tick',
          style: markStyle
        })
      );
    }

    return marks;
  }, [indicatorType, line1Coords, color, processedSize, zIndex, markCount, calculateMidpoint, calculateLineAngle, getPercentageCoords]);

  // Render perpendicular indicator (right angle symbol at intersection)
  const renderPerpendicularIndicator = React.useMemo(() => {
    if (indicatorType !== 'perpendicular' || !line2Coords) return null;

    // Calculate intersection point of two lines
    const [x1, y1, x2, y2] = line1Coords;
    const [x3, y3, x4, y4] = line2Coords;

    // Line 1: y - y1 = m1(x - x1), where m1 = (y2-y1)/(x2-x1)
    // Line 2: y - y3 = m2(x - x3), where m2 = (y4-y3)/(x4-x3)
    const m1 = (y2 - y1) / (x2 - x1);
    const m2 = (y4 - y3) / (x4 - x3);

    // Intersection: x = (m1*x1 - m2*x3 + y3 - y1) / (m1 - m2)
    let intersectX, intersectY;
    
    if (Math.abs(x2 - x1) < 0.001) { // Line 1 is vertical
      intersectX = x1;
      intersectY = m2 * (intersectX - x3) + y3;
    } else if (Math.abs(x4 - x3) < 0.001) { // Line 2 is vertical
      intersectX = x3;
      intersectY = m1 * (intersectX - x1) + y1;
    } else {
      intersectX = (m1 * x1 - m2 * x3 + y3 - y1) / (m1 - m2);
      intersectY = m1 * (intersectX - x1) + y1;
    }

    const position = getPercentageCoords(intersectX, intersectY);
    const angle = calculateLineAngle(line1Coords);
    const sizeValue = parseFloat(processedSize);

    const squareStyle = {
      position: 'absolute',
      left: position.left,
      top: position.top,
      width: `${sizeValue}px`,
      height: `${sizeValue}px`,
      border: `2px solid ${color}`,
      backgroundColor: 'transparent',
      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      transformOrigin: 'center center',
      zIndex: zIndex,
      pointerEvents: 'none'
    };

    return React.createElement('div', {
      key: 'perpendicular-square',
      className: 'property-indicator-perpendicular',
      style: squareStyle
    });
  }, [indicatorType, line1Coords, line2Coords, color, processedSize, zIndex, calculateLineAngle, getPercentageCoords]);

  // Render symmetry line indicator (dashed line)
  const renderSymmetryIndicator = React.useMemo(() => {
    if (indicatorType !== 'symmetry') return null;

    const [x1, y1, x2, y2] = line1Coords;
    const position1 = getPercentageCoords(x1, y1);
    const position2 = getPercentageCoords(x2, y2);

    // Calculate line length and angle
    const dx = x2 - x1;
    const dy = y2 - y1;
    const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
    const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
      GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
    
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1600;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
    
    const gridUnitWidth = viewportWidth / gridCols;
    const gridUnitHeight = viewportHeight / gridRows;
    const pixelDx = dx * gridUnitWidth;
    const pixelDy = dy * gridUnitHeight;
    const length = Math.sqrt(pixelDx * pixelDx + pixelDy * pixelDy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const lineStyle = {
      position: 'absolute',
      left: position1.left,
      top: position1.top,
      width: `${length}px`,
      height: '0',
      borderTop: `2px dashed ${color}`,
      transform: `rotate(${angle}deg)`,
      transformOrigin: '0 0',
      zIndex: zIndex,
      pointerEvents: 'none'
    };

    return React.createElement('div', {
      key: 'symmetry-line',
      className: 'property-indicator-symmetry',
      style: lineStyle
    });
  }, [indicatorType, line1Coords, color, zIndex, getPercentageCoords]);

  // Container style
  const containerStyle = React.useMemo(() => ({
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: zIndex
  }), [zIndex]);

  // Build children array based on indicator type
  const children = React.useMemo(() => {
    switch (indicatorType) {
      case 'parallel':
        return renderParallelIndicator;
      case 'equal-sides':
        return renderEqualSidesIndicator;
      case 'perpendicular':
        return renderPerpendicularIndicator;
      case 'symmetry':
        return renderSymmetryIndicator;
      default:
        return null;
    }
  }, [indicatorType, renderParallelIndicator, renderEqualSidesIndicator, renderPerpendicularIndicator, renderSymmetryIndicator]);

  return React.createElement('div', {
    id: id || `property-indicator-${indicatorType}-${Math.random().toString(36).substr(2, 9)}`,
    className: `property-indicator property-indicator-${indicatorType}`,
    style: containerStyle,
    'data-indicator-type': indicatorType
  }, children);
});

// Property Indicator Element Configuration
const PropertyIndicatorElement = {
  propertyIndicator: {
    type: 'propertyIndicator',
    zIndex: 1500,
    props: {
      indicatorType: 'parallel',
      line1Coords: [0, 0, 100, 100],
      line2Coords: null,
      color: '#FF6600',
      size: '15gc',
      markCount: 1
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('propertyIndicator', (props, elementId) => {
      return React.createElement(PropertyIndicatorComponent, props);
    })
  }
};

// Export to window for global access
if (typeof window !== 'undefined') {
  window.PropertyIndicatorComponent = {
    PropertyIndicatorComponent,
    PropertyIndicatorElement
  };
}

