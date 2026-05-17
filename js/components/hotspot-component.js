/**
 * Hotspot Component - React 18 Optimized
 * 
 * A clickable circular hotspot component that indicates an area to click on.
 * Features pulse animation to draw attention and customizable styling.
 */

// Dependencies: SharedUtilities, GridCellFontUtils, gridPositions should be loaded before this file

/**
 * Hotspot Component
 * @param {Object} props - Component props
 * @param {string} props.id - Component ID
 * @param {string} props.elementName - Element name from PageConfig
 * @param {number} props.currentPage - Current page number
 * @param {Array<number>} props.coordinates - [x1, y1, x2, y2] coordinates
 * @param {number|string} props.zIndex - Z-index value
 * @param {string} props.backgroundColor - Background color (default: 'rgba(255, 153, 0, 0.6)')
 * @param {string} props.borderColor - Border color (default: '#FF9900')
 * @param {string} props.borderWidth - Border width (default: '3px')
 * @param {string} props.size - Size of the hotspot (diameter) in gc units or pixels (default: '40gc')
 * @param {boolean} props.animated - Whether to show pulse animation (default: true)
 * @param {Function} props.onClick - Click handler function
 * @param {string} props.cursor - Cursor style (default: 'pointer')
 * @param {React.ReactNode} props.children - Optional content inside hotspot
 */
const HotspotComponent = React.memo((props) => {
  const {
    id,
    elementName,
    currentPage,
    coordinates,
    zIndex,
    backgroundColor = 'rgba(255, 153, 0, 0.6)',
    borderColor = '#FF9900',
    borderWidth = '3gc',
    size = '40gc',
    innerCircleSize = '5gc',
    animated = true,
    onClick,
    onMouseDown,
    cursor = 'pointer',
    children
  } = props;

  // Calculate position from coordinates
  const getPositionFromCoordinates = React.useCallback(() => {
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 4) {
      // Use the grid positioning utility if available
      if (typeof gridPositions !== 'undefined' && gridPositions.convertToCSS) {
        const cssPosition = gridPositions.convertToCSS(coordinates, elementName || id, 'page', 'custom');
        return cssPosition.css || cssPosition;
      }
      
      // Fallback: manual calculation based on current grid system
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
        position: 'absolute',
        left: `${left.toFixed(2)}%`,
        top: `${top.toFixed(2)}%`,
        width: `${width.toFixed(2)}%`,
        height: `${height.toFixed(2)}%`
      };
    }
    
    return null;
  }, [coordinates, elementName, id]);

  const position = React.useMemo(() => {
    return getPositionFromCoordinates();
  }, [getPositionFromCoordinates]);

  // Process GC units for styling
  const processGcProperty = (value) => {
    if (typeof GridCellFontUtils !== 'undefined' && GridCellFontUtils.processGcProperty) {
      return GridCellFontUtils.processGcProperty(value, coordinates || [0, 0, 100, 100]);
    }
    return value;
  };

  // Handle click event
  const handleClick = React.useCallback((e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
    // Play click sound if available
    if (typeof window !== 'undefined' && window.playCarClickSound) {
      window.playCarClickSound('hotspot');
    }
  }, [onClick]);

  // Build container style
  const containerStyle = React.useMemo(() => {
    const processedSize = processGcProperty(size);
    const processedBorderWidth = processGcProperty(borderWidth);
    
    const baseStyle = {
      position: 'absolute',
      width: processedSize,
      height: processedSize,
      borderRadius: '50%', // Make it circular
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      borderWidth: processedBorderWidth,
      borderStyle: 'solid',
      cursor: cursor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      zIndex: zIndex || 1000,
      transition: 'all 0.2s ease'
    };

    // Apply position if available
    if (position) {
      // Extract CSS values (handle both object with css property and direct object)
      const css = position.css || position;
      if (css) {
        const left = css.left ? parseFloat(css.left.replace('%', '')) : 0;
        const top = css.top ? parseFloat(css.top.replace('%', '')) : 0;
        const width = css.width ? parseFloat(css.width.replace('%', '')) : 0;
        const height = css.height ? parseFloat(css.height.replace('%', '')) : 0;
        
        // Center the hotspot on the coordinates
        baseStyle.left = `${left + width / 2}%`;
        baseStyle.top = `${top + height / 2}%`;
        baseStyle.transform = 'translate(-50%, -50%)';
      }
    } else if (coordinates && Array.isArray(coordinates) && coordinates.length === 4) {
      // Fallback: calculate center directly from coordinates
      const [x1, y1, x2, y2] = coordinates;
      const gridRows = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].rows : 900;
      const gridCols = typeof GridPrecisionConfig !== 'undefined' ? 
        GridPrecisionConfig.precisionSettings[GridPrecisionConfig.currentPrecision].cols : 1600;
      
      const centerX = ((x1 + x2) / 2 - 1) / gridCols * 100;
      const centerY = ((y1 + y2) / 2 - 1) / gridRows * 100;
      
      baseStyle.left = `${centerX.toFixed(2)}%`;
      baseStyle.top = `${centerY.toFixed(2)}%`;
      baseStyle.transform = 'translate(-50%, -50%)';
    } else {
      // Final fallback: center of screen
      baseStyle.left = '50%';
      baseStyle.top = '50%';
      baseStyle.transform = 'translate(-50%, -50%)';
    }

    return baseStyle;
  }, [position, coordinates, backgroundColor, borderColor, borderWidth, size, cursor, zIndex]);

  // Build className with animation
  const className = React.useMemo(() => {
    const classes = ['hotspot-component'];
    if (animated) {
      classes.push('hotspot-pulse');
    }
    return classes.join(' ') || undefined;
  }, [animated]);

  // Handle hover effects
  const [isHovered, setIsHovered] = React.useState(false);
  
  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false);
  }, []);

  // Add hover style
  const finalStyle = React.useMemo(() => {
    const baseTransform = containerStyle.transform || 'translate(-50%, -50%)';
    if (isHovered) {
      return {
        ...containerStyle,
        transform: `${baseTransform} scale(1.1)`,
        boxShadow: `0 0 20px ${borderColor}`
      };
    }
    return containerStyle;
  }, [containerStyle, isHovered, borderColor]);

  // Inner circle style
  const processedInnerCircleSize = processGcProperty(innerCircleSize);
  const innerCircleColor = borderColor === 'transparent' ? '#000000' : borderColor;
  const innerCircleStyle = {
    width: processedInnerCircleSize,
    height: processedInnerCircleSize,
    borderRadius: '50%',
    backgroundColor: innerCircleColor,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none' // Don't interfere with click events
  };

  return React.createElement('div', {
    id: id || `${elementName}-${currentPage}`,
    className: className,
    style: finalStyle,
    onClick: handleClick,
    onMouseDown: onMouseDown, // Support onMouseDown for dragging
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    'data-element-name': elementName,
    'data-page': currentPage,
    'data-hotspot': 'true',
    role: 'button',
    tabIndex: 0,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e);
      }
    },
    'aria-label': 'Clickable hotspot'
  }, [
    // Inner circle
    React.createElement('div', {
      key: 'inner-circle',
      className: 'hotspot-inner-circle',
      style: innerCircleStyle
    }),
    // Children (if any)
    ...(children ? (Array.isArray(children) ? children : [children]) : [])
  ]);
});

// Hotspot Element Configuration
const HotspotElement = {
  hotspot: {
    type: 'hotspot',
    coordinates: [0, 0, 100, 100],
    zIndex: 1000,
    props: {
      backgroundColor: 'rgba(255, 153, 0, 0.6)',
      borderColor: '#FF9900',
      borderWidth: '3gc',
      size: '40gc',
      innerCircleSize: '5gc',
      animated: true,
      cursor: 'pointer'
    },
    
    createOptimized: window.SharedUtilities?.createOptimizedElementFactory('hotspot', (props, elementId) => {
      return React.createElement(HotspotComponent, props);
    })
  }
};

// Export to window for global access
if (typeof window !== 'undefined') {
  window.HotspotComponent = {
    HotspotComponent,
    HotspotElement
  };
}

