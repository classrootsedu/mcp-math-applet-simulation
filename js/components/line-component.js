/* global React, GridCellFontUtils, gridPositions */

const LineComponent = React.memo((props) => {
  const {
    id,
    elementName,
    currentPage,
    coordinates,
    zIndex,
    lineType = 'horizontal', // 'horizontal', 'vertical', or 'slanted'
    lineSubtype = 'line', // 'line' or 'arrow' (arrow has arrowhead at end)
    borderWidth = '2gc',
    borderColor = '#000000',
    borderStyle = 'solid',
    backgroundColor = 'transparent',
    arrowheadSize = '10gc', // Size of arrowhead for arrow subtype
    onClick,
    cursor = 'default',
    style = {}, // Additional style props to merge
    children
  } = props;

  // Process GC units for styling
  const processGcProperty = (value, propertyName = 'borderWidth') => {
    if (typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcProperty) {
      return GridCellFontUtils.processGcProperty(value, propertyName);
    }
    return value;
  };

  // Calculate position from coordinates
  const getPositionFromCoordinates = React.useCallback(() => {
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 4) {
      const [x1, y1, x2, y2] = coordinates;
      
      // Adjust coordinates based on line type
      let adjustedX2 = x2;
      let adjustedY2 = y2;
      
      // Get grid dimensions for percentage calculation
      const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
      const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
      
      if (lineType === 'vertical') {
        // For vertical: x2 = x1 + borderWidth (in grid units)
        // The actual width will be set in containerStyle based on borderWidth
        adjustedX2 = x1; // Will be adjusted in containerStyle
      } else if (lineType === 'horizontal') {
        // For horizontal: y2 = y1 + borderWidth (in grid units)
        adjustedY2 = y1; // Will be adjusted in containerStyle
      }
      
      // Convert to percentage
      const left = ((x1 - 1) / gridCols) * 100;
      const top = ((y1 - 1) / gridRows) * 100;
      
      // For vertical line: width is borderWidth, height is from y1 to y2
      // For horizontal line: height is borderWidth, width is from x1 to x2
      // For slanted line: calculate length and angle
      let width, height, angle, lineLength;
      if (lineType === 'vertical') {
        width = 0; // Will be set to borderWidth in containerStyle
        height = ((y2 - y1 + 1) / gridRows) * 100;
      } else if (lineType === 'horizontal') {
        width = ((x2 - x1 + 1) / gridCols) * 100;
        height = 0; // Will be set to borderWidth in containerStyle
      } else if (lineType === 'slanted') {
        // Calculate line length in grid units
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthInGridUnits = Math.sqrt(dx * dx + dy * dy);
        // Convert to percentage based on diagonal of grid
        const gridDiagonal = Math.sqrt(gridCols * gridCols + gridRows * gridRows);
        lineLength = (lengthInGridUnits / gridDiagonal) * 100;
        // Calculate angle in degrees
        angle = Math.atan2(dy, dx) * (180 / Math.PI);
      }
      
      const result = {
        left: `${left.toFixed(2)}%`,
        top: `${top.toFixed(2)}%`
      };
      
      if (width > 0) result.width = `${width.toFixed(2)}%`;
      if (height > 0) result.height = `${height.toFixed(2)}%`;
      if (lineLength !== undefined) result.lineLength = lineLength;
      if (angle !== undefined) result.angle = angle;
      
      return result;
    }
    return null;
  }, [coordinates, lineType, borderWidth]);

  const position = React.useMemo(() => getPositionFromCoordinates(), [getPositionFromCoordinates]);

  // Build container style
  const containerStyle = React.useMemo(() => {
    const processedBorderWidth = processGcProperty(borderWidth, 'borderWidth');
    
    const baseStyle = {
      position: 'absolute',
      backgroundColor: backgroundColor,
      boxSizing: 'border-box',
      zIndex: zIndex || 1000,
      cursor: cursor,
      transition: 'all 0.2s ease',
      // Ensure container can contain absolutely positioned arrowhead
      overflow: 'visible'
    };

    // Apply position if available
    if (position) {
      // Extract CSS values (handle both object with css property and direct object)
      const css = position.css || position;
      if (css.left !== undefined) baseStyle.left = css.left;
      if (css.top !== undefined) baseStyle.top = css.top;
    }

    // For vertical lines: width = borderWidth, height from coordinates
    if (lineType === 'vertical') {
      baseStyle.width = processedBorderWidth;
      baseStyle.height = position ? (position.height || position.css?.height || 'auto') : 'auto';
      // Use border for the line to support dashed/dotted styles
      baseStyle.borderLeft = `${processedBorderWidth} ${borderStyle} ${borderColor}`;
      baseStyle.borderRight = 'none';
      baseStyle.borderTop = 'none';
      baseStyle.borderBottom = 'none';
      baseStyle.backgroundColor = backgroundColor;
    }
    
    // For horizontal lines: height = borderWidth, width from coordinates
    else if (lineType === 'horizontal') {
      baseStyle.height = processedBorderWidth;
      baseStyle.width = position ? (position.width || position.css?.width || 'auto') : 'auto';
      // Use border for the line to support dashed/dotted styles
      baseStyle.borderTop = `${processedBorderWidth} ${borderStyle} ${borderColor}`;
      baseStyle.borderBottom = 'none';
      baseStyle.borderLeft = 'none';
      baseStyle.borderRight = 'none';
      baseStyle.backgroundColor = backgroundColor;
    }
    
    // For slanted lines: calculate length and angle, use borderTop
    else if (lineType === 'slanted' && position && coordinates) {
      const angle = position.angle;
      
      if (angle !== undefined && Array.isArray(coordinates) && coordinates.length === 4) {
        const [x1, y1, x2, y2] = coordinates;
        const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
          GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
        const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
          GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
        
        // Calculate length in grid units
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthInGridUnits = Math.sqrt(dx * dx + dy * dy);
        
        // Convert grid units to pixels using viewport dimensions
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1600;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
        
        // Calculate pixel size of one grid unit
        const gridUnitWidth = viewportWidth / gridCols;
        const gridUnitHeight = viewportHeight / gridRows;
        
        // For diagonal, use average or calculate based on angle
        // More accurate: calculate actual pixel distance
        const pixelDx = dx * gridUnitWidth;
        const pixelDy = dy * gridUnitHeight;
        const lengthInPixels = Math.sqrt(pixelDx * pixelDx + pixelDy * pixelDy);
        
        baseStyle.width = `${lengthInPixels}px`;
        baseStyle.height = processedBorderWidth;
        baseStyle.borderTop = `${processedBorderWidth} ${borderStyle} ${borderColor}`;
        baseStyle.borderBottom = 'none';
        baseStyle.borderLeft = 'none';
        baseStyle.borderRight = 'none';
        baseStyle.backgroundColor = backgroundColor;
        baseStyle.transform = `rotate(${angle}deg)`;
        baseStyle.transformOrigin = '0 0';
      }
    }

    // Merge additional style props
    return {
      ...baseStyle,
      ...style
    };
  }, [position, lineType, borderWidth, borderColor, borderStyle, backgroundColor, zIndex, cursor, coordinates, style]);

  // Calculate arrowhead style for arrow subtype
  const arrowheadStyle = React.useMemo(() => {
    if (lineSubtype !== 'arrow' || !position || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 4) {
      if (lineSubtype === 'arrow') {
        console.log('LineComponent: Arrowhead not created - missing data', { lineSubtype, hasPosition: !!position, hasCoordinates: !!coordinates });
      }
      return null;
    }

    const [x1, y1, x2, y2] = coordinates;
    const angle = position.angle;
    const processedArrowheadSize = processGcProperty(arrowheadSize, 'borderWidth');
    
    // Base arrowhead style (triangle pointing right by default)
    // Using borderBottom instead of borderTop to create upward-pointing triangle
    const baseArrowStyle = {
      position: 'absolute',
      width: '0',
      height: '0',
      borderLeft: `${processedArrowheadSize} solid transparent`,
      borderRight: `${processedArrowheadSize} solid transparent`,
      borderBottom: `${processedArrowheadSize} solid ${borderColor}`,
      borderTop: 'none',
      pointerEvents: 'none',
      zIndex: (zIndex || 1000) + 1
    };
    
    if (angle === undefined) {
      // For horizontal/vertical lines, position at end of line container
      let calculatedAngle = 0;
      let positioning = {};
      
      if (lineType === 'horizontal') {
        // Horizontal line: arrow at right edge (x2 > x1) or left edge (x2 < x1)
        // borderBottom creates triangle pointing up, rotate to point in line direction
        if (x2 > x1) {
          // Point right: rotate -90deg from up
          positioning = { right: '0', top: '50%', transform: 'translate(50%, -50%) rotate(-90deg)' };
        } else {
          // Point left: rotate 90deg from up
          positioning = { left: '0', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' };
        }
      } else if (lineType === 'vertical') {
        // Vertical line: arrow at bottom edge (y2 > y1) or top edge (y2 < y1)
        if (y2 > y1) {
          // Point down: rotate 180deg from up
          positioning = { bottom: '0', left: '50%', transform: 'translate(-50%, 50%) rotate(180deg)' };
        } else {
          // Point up: no rotation needed (borderBottom already points up)
          positioning = { top: '0', left: '50%', transform: 'translate(-50%, -50%) rotate(0deg)' };
        }
      } else {
        return null;
      }
      
      return {
        ...baseArrowStyle,
        ...positioning,
        transformOrigin: 'center center'
      };
    } else {
      // Slanted line with angle - position at end of line
      // The line is rotated, so we position the arrowhead at the end (right edge)
      // borderBottom points up, so we need to rotate to match line direction
      // The line angle is already calculated, so we rotate the arrowhead to match
      const arrowAngle = angle + 90; // borderBottom points up (90deg), add line angle
      
      return {
        ...baseArrowStyle,
        right: '0',
        top: '50%',
        transform: `translate(50%, -50%) rotate(${arrowAngle}deg)`,
        transformOrigin: 'center center'
      };
    }
  }, [lineSubtype, position, coordinates, lineType, arrowheadSize, borderColor, zIndex]);

  const handleClick = React.useCallback((e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  }, [onClick]);

  const className = React.useMemo(() => {
    return `line-component line-${lineType} line-subtype-${lineSubtype}`;
  }, [lineType, lineSubtype]);

  const childrenArray = React.useMemo(() => {
    const result = [];
    
    // Add arrowhead if subtype is arrow
    if (arrowheadStyle) {
      console.log('LineComponent: Creating arrowhead with style', arrowheadStyle);
      result.push(
        React.createElement('div', {
          key: 'arrowhead',
          className: 'line-arrowhead',
          style: arrowheadStyle,
          'data-arrowhead': 'true'
        })
      );
    } else if (lineSubtype === 'arrow') {
      console.log('LineComponent: Arrow subtype but no arrowheadStyle', { lineSubtype, hasPosition: !!position, hasCoordinates: !!coordinates });
    }
    
    // Add any provided children
    if (children) {
      if (Array.isArray(children)) {
        result.push(...children);
      } else {
        result.push(children);
      }
    }
    
    return result;
  }, [arrowheadStyle, children]);

  return React.createElement('div', {
    id: id || `${elementName}-${currentPage}`,
    className: className,
    style: containerStyle,
    onClick: handleClick,
    'data-element-name': elementName,
    'data-page': currentPage,
    'data-line-type': lineType,
    'data-line-subtype': lineSubtype,
    role: onClick ? 'button' : undefined,
    tabIndex: onClick ? 0 : undefined,
    onKeyDown: onClick ? (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e);
      }
    } : undefined,
    'aria-label': onClick ? 'Clickable line' : undefined
  }, childrenArray);
});

// Line Element Configuration
const LineElement = {
  line: {
    type: 'line',
    coordinates: [0, 0, 100, 100],
    zIndex: 1000,
    props: {
      componentType: 'LineComponent',
      lineType: 'horizontal',
      lineSubtype: 'line',
      borderWidth: '2gc',
      borderColor: '#000000',
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      arrowheadSize: '10gc',
      cursor: 'default'
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('line', (props, elementId) => {
      return React.createElement(LineComponent, props);
    })
  }
};

// Export for use in elements-registry.js
if (typeof window !== 'undefined') {
  window.LineComponent = {
    LineComponent: LineComponent,
    LineElement: LineElement
  };
  // Also export directly for backward compatibility
  window.LineElement = LineElement;
}

